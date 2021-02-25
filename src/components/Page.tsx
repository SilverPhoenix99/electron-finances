import _ from 'lodash';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import Chart from '~/components/Chart';
import { getDb } from '~/lib/db';
import { ImportButton } from '~/components/ImportButton';

export default function Page() {

    const [series, setSeries] = useState<ApexAxisChartSeries>([]);
    useEffect(() => { loadData(setSeries); }, []);

    return <>
        <div>
            <h2>Header</h2>
        </div>
        <div className='page-body' style={{display: 'flex', width: '100%'}}>
            <div className='debug-border' style={{order: 1, width: '20%'}}>
                <h2>Left</h2>
                <ImportButton />
            </div>
            <div className='debug-border' style={{order: 3, width: '20%'}}>
                <h2>Right</h2>
            </div>
            <div className='debug-border' style={{order: 2, width: '60%'}}>
                <h2>Main Body</h2>
                <Chart series={series} />
            </div>
        </div>
    </>;
}

async function loadData(setSeries: Dispatch<SetStateAction<ApexAxisChartSeries>>) {

    const db = await getDb();
    const {store} = db.transaction('transactions');
    const transactions = await store.getAll();

    const data: ApexAxisChartSeries = _.chain(transactions)
        .reduce((acc, {category, date, account: [origin, destination], amount}) => {

            if (category === 'Transferência') {
                acc.push({ date, account: origin!, amount: -amount });
                acc.push({ date, account: destination!, amount });
            }
            else {
                acc.push({ date, account: amount < 0 ? origin! : destination!, amount });
            }

            return acc;

        }, [] as { date: Date, account: string, amount: number }[])
        .groupBy('account')
        .mapValues(ts =>
            _.chain(ts)
                .groupBy('date')
                .values()
                .map<[number, number]>(ts => [ts[0].date.getTime(), _.sumBy(ts, 'amount')])
                .reduce((acc, d) => {
                    if (!acc.length) {
                        acc.push(d);
                        return acc;
                    }

                    const [, previousAmount] = acc[acc.length-1];
                    const [date, amount] = d;
                    acc.push([date, previousAmount + amount]);

                    return acc;
                }, [] as [number, number][])
                .map(d => { d[1] /= 100; return d; })
                .value()
        )
        .map((amounts, account) => ({ name: account, data: amounts }))
        .sortBy(({data}) => data[0][0])
        .value();

    setSeries(data);
}
