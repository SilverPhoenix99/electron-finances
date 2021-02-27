import _ from 'lodash';
import { DateTime } from 'luxon';
import { useCallback, useEffect, useState } from 'react';
import Chart from '~/components/Chart';
import { getDb, Transaction } from '~/lib/db';
import { ImportButton } from '~/components/ImportButton';
import { Button, ButtonGroup, Icon, Intent } from '@blueprintjs/core';

export default function Page() {

    const [graphType, setgraphType] = useState<GraphType>('flow');
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
                    <ButtonGroup>
                        {
                            _.map<GraphType>(['flow', 'accounts'], (type: GraphType) =>
                                <Button
                                    key={type}
                                    intent={graphType === type ? Intent.PRIMARY : Intent.NONE}
                                    onClick={useCallback(() => setgraphType(type), [])}
                                >
                                    {_.capitalize(type)}
                                </Button>
                            )
                        }
                    </ButtonGroup>
                </div>
                <div>
                    <Icon icon='time' style={{marginRight: '0.5rem'}} />
                    <ButtonGroup>
                        {
                            _.map<DateGroupingType>(['daily', 'weekly', 'monthly'], (type: DateGroupingType) =>
                                <Button
                                    key={type}
                                    intent={dateGrouping === type ? Intent.PRIMARY : Intent.NONE}
                                    onClick={useCallback(() => setDateGrouping(type), [])}
                                >
                                    {_.capitalize(type)}
                                </Button>
                            )
                        }
                    </ButtonGroup>
                </div>
            </div>
            <div /*className='debug-border'*/ style={{order: 2, width: '68%', padding: '0 0.38rem'}}>
                <h2>Main Body</h2>
                <Chart series={series} />
            </div>
        </div>
    </>;
}

type FlatTransaction = { date: Date, account: string, amount: number };

async function loadTransactions(): Promise<Transaction[]> {
    const db = await getDb();
    const {store} = db.transaction('transactions');
    return await store.getAll();
}

const groupDaily = (date: Date): Date => DateTime.fromJSDate(date).startOf('day').toJSDate();

const groupWeekly = (date: Date): Date => {
    let newDate = DateTime.fromJSDate(date);
    // move to end of the week (Friday):
    newDate = newDate.plus({ day: (12 - newDate.weekday) % 7 });
    return newDate.toJSDate();
}

const groupMonthly = (date: Date): Date => DateTime.fromJSDate(date).endOf('month').toJSDate();

type DateGroupingType = 'daily' | 'weekly' | 'monthly';
type DateGrouping = (date: Date) => Date;

const DATE_GROUPING: Record<DateGroupingType, DateGrouping> = {
    daily: groupDaily,
    weekly: groupWeekly,
    monthly: groupMonthly
};

const buildFlow = (transactions: Transaction[], dateGrouping: (date: Date) => Date): ApexAxisChartSeries =>
    _.chain(transactions)
        .reject(t => t.category === 'Transferência')
        .groupBy(({date}) => dateGrouping(date).getTime())
        .map((ts, time) => {
            const [incomes, expenses] = _.partition(ts, ({amount}) => amount > 0);
            return {
                time: Number(time),
                income: _.sumBy(incomes, 'amount'),
                expenses: -_.sumBy(expenses, 'amount')
            };
        })
        .sortBy('time')
        .transform(({ Income, Expenses, Flow, Balance }, {time, income, expenses}) => {
            Income.push({ x: time, y: income });
            Expenses.push({ x: time, y: expenses });
            const flow = income - expenses;
            Flow.push({ x: time, y: flow });

            const previousBalance = Balance[Balance.length-1]?.y ?? 0;
            Balance.push({ x: time, y: flow + previousBalance });

        }, { Income: [], Expenses: [], Flow: [], Balance: [] } as Record<'Income' | 'Expenses' | 'Flow' | 'Balance', Record<'x' | 'y', number>[]>)
        .map((data, name) => ({ name, data: _.map(data, d => { d.y /= 100; return d; }) }))
        .value();

const buildAccountBalances = (transactions: Transaction[], dateGrouping: (date: Date) => Date): ApexAxisChartSeries =>
    _.chain(transactions)
        .transform(flattenTransaction, [] as FlatTransaction[])
        .groupBy('account')
        .mapValues(ts =>
            _.chain(ts)
                .groupBy(({date}) => dateGrouping(date).getTime())
                .values()
                .map((ts, time) => ({ x: Number(time), y: _.sumBy(ts, 'amount') }))
                .transform((acc, d) => {
                    const previousAmount = acc[acc.length-1]?.y ?? 0;
                    const {x, y} = d;
                    acc.push({ x, y: previousAmount + y });
                }, [] as Record<'x' | 'y', number>[])
                .map(d => { d.y /= 100; return d; })
                .value()
        )
        .map((amounts, account) => ({ name: account, data: amounts }))
        .sortBy(({data}) => data[0].x)
        .value();


type GraphType = 'flow' | 'accounts';
type GraphBuilder = (transactions: Transaction[], dateGrouping: (date: Date) => Date) => ApexAxisChartSeries;

const GRAPH_TYPE: Record<GraphType, GraphBuilder> = {
    flow: buildFlow,
    accounts: buildAccountBalances,
}


function flattenTransaction(acc: FlatTransaction[], transaction: Transaction): void {

    const {category, date, account: [origin, destination], amount} = transaction;

    if (category === 'Transferência') {
        acc.push({ date, account: origin!, amount: -amount });
        acc.push({ date, account: destination!, amount });
    }
    else {
        acc.push({ date, account: amount < 0 ? origin! : destination!, amount });
    }
}
