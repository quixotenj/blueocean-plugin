import React, { Component, PropTypes } from 'react';
import { ResultItem } from '@jenkins-cd/design-language';
import { calculateLogUrl } from '../util/UrlUtils';

import LogConsole from './LogConsole';

const { object, func, string, bool } = PropTypes;

export default class Node extends Component {
    componentWillMount() {
        const { node, nodesBaseUrl, fetchLog } = this.props;
        const { config = {} } = this.context;
        if (node && node.isFocused) {
            const mergedConfig = { ...config, node, nodesBaseUrl };
            fetchLog(mergedConfig);
        }
    }

    componentWillReceiveProps(nextProps) {
        const { node, logs, nodesBaseUrl, fetchLog, followAlong } = nextProps;
        const { config = {} } = this.context;
        const mergedConfig = { ...config, node, nodesBaseUrl };
        if (logs && logs !== this.props.logs) {
            const key = calculateLogUrl(mergedConfig);
            const log = logs ? logs[key] : null;
            if (log && log !== null) {
                const number = Number(log.newStart);
                // kill current  timeout if any
                this.clearThisTimeout();
                if (number > 0 && followAlong) {
                    mergedConfig.newStart = log.newStart;
                    this.clearThisTimeout();
                    this.timeout = setTimeout(() => fetchLog({ ...mergedConfig }), 1000);
                }
            }
        }
    }

    componentWillUnmount() {
        this.clearThisTimeout();
    }

    clearThisTimeout() {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
    }

    render() {
        const { node, logs, nodesBaseUrl, fetchLog, followAlong } = this.props;
        // Early out
        if (!node || !fetchLog) {
            return null;
        }
        const { config = {} } = this.context;
        const {
          title,
          durationInMillis,
          result,
          id,
          isFocused,
          state,
        } = node;

        const resultRun = result === 'UNKNOWN' || !result ? state : result;
        const log = logs ? logs[calculateLogUrl({ ...config, node, nodesBaseUrl })] : null;
        const getLogForNode = () => {
            if (!log || !log.logArray) {
                fetchLog({ ...config, node, nodesBaseUrl });
            }
        };
        const runResult = resultRun.toLowerCase();
        const scrollToBottom =
            resultRun.toLowerCase() === 'failure'
            || (resultRun.toLowerCase() === 'running' && followAlong)
        ;
        // console.log(followAlong, 'followAlong_step');
        return (<div>
            <ResultItem
              key={id}
              result={runResult}
              expanded={isFocused}
              label={title}
              onExpand={getLogForNode}
              durationMillis={durationInMillis}
            >
                { log && <LogConsole key={id} logArray={log.logArray} scrollToBottom={scrollToBottom} /> } &nbsp;
            </ResultItem>
      </div>);
    }
}

Node.propTypes = {
    node: object.isRequired,
    followAlong: bool,
    logs: object,
    fetchLog: func,
    nodesBaseUrl: string,
};
