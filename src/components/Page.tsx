import { Icon } from '@blueprintjs/core';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { getDb, Transaction } from '~/lib/db';
import Chart from '~/components/Chart';
import { ImportButton } from '~/components/ImportButton';
import DateGroupingPicker, { DateGroupingType, DATE_GROUPING } from '~/components/DateGroupingPicker';
import GraphTypePicker, { GraphType, GRAPH_TYPE } from './GraphTypePicker';

export default function Page() {

    const [graphType, setGraphType] = useState<GraphType>('flow');
    const [dateGrouping, setDateGrouping] = useState<DateGroupingType>('monthly');
    const [series, setSeries] = useState<ApexAxisChartSeries>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    useEffect(() => { loadTransactions().then(setTransactions); }, []);

    useEffect(() => {
        if (transactions.length) {
            const build = GRAPH_TYPE[graphType];
            const grouping = DATE_GROUPING[dateGrouping];
            setSeries(build(transactions, grouping));
        }
    }, [transactions, graphType, dateGrouping]);

    return <>
        <div style={{padding: '0 0.75rem'}}>
            <h2>Header</h2>
        </div>
        <div className='page-body' style={{display: 'flex', width: '100%'}}>
            <div /*className='debug-border'*/ style={{order: 1, width: '16%', paddingLeft: '0.75rem', paddingRight: '0.38rem'}}>
                <h2>Left</h2>
                <ImportButton />
            </div>
            <div /*className='debug-border'*/ style={{order: 3, width: '16%', paddingLeft: '0.38rem', paddingRight: '0.75rem'}}>
                <h2>Right</h2>
                <div style={{marginBottom: '0.88rem'}}>
                    <Icon icon='timeline-line-chart' style={{marginRight: '0.5rem'}} />
                    <GraphTypePicker graphType={graphType} onChange={setGraphType} />
                </div>
                <div>
                    <Icon icon='time' style={{marginRight: '0.5rem'}} />
                    <DateGroupingPicker dateGrouping={dateGrouping} onChange={setDateGrouping} />
                </div>
            </div>
            <div /*className='debug-border'*/ style={{order: 2, width: '68%', padding: '0 0.38rem'}}>
                <h2>Main Body</h2>
                <Chart series={series} />
            </div>
        </div>
    </>;
}

async function loadTransactions(): Promise<Transaction[]> {
    const db = await getDb();
    const {store} = db.transaction('transactions');
    return await store.getAll();
}
