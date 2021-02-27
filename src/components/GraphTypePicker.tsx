import { Button, ButtonGroup, Intent } from '@blueprintjs/core';
import _ from "lodash";
import { useCallback } from 'react';
import { Transaction } from "~/lib/db";
import { DateGrouping } from "./DateGroupingPicker";

export type GraphType = 'flow' | 'accounts';
export type GraphBuilder = (transactions: Transaction[], dateGrouping: DateGrouping) => ApexAxisChartSeries;

interface Props {
    graphType: GraphType;
    onChange: (selectedType: GraphType) => void;
}

export default function GraphTypePicker({graphType, onChange}: Props) {
    return <ButtonGroup>
        {
            _.map<GraphType>(['flow', 'accounts'], (type: GraphType) =>
                <Button
                    key={type}
                    intent={graphType === type ? Intent.PRIMARY : Intent.NONE}
                    onClick={useCallback(() => onChange(type), [])}
                >
                    {_.capitalize(type)}
                </Button>
            )
        }
    </ButtonGroup>
}

export const buildFlow = (transactions: Transaction[], dateGrouping: DateGrouping): ApexAxisChartSeries =>
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

        }, { Balance: [], Income: [], Flow: [], Expenses: [] } as Record<'Income' | 'Expenses' | 'Flow' | 'Balance', Record<'x' | 'y', number>[]>)
        .map((data, name) => ({ name, data: _.map(data, d => { d.y /= 100; return d; }) }))
        .value()
;


type FlatTransaction = { date: Date, account: string, amount: number };

export const buildAccountBalances = (transactions: Transaction[], dateGrouping: DateGrouping): ApexAxisChartSeries =>
    _.chain(transactions)
        .transform(flattenTransaction, [] as FlatTransaction[])
        .groupBy('account')
        .mapValues(ts =>
            _.chain(ts)
                .groupBy(({date}) => dateGrouping(date).getTime())
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
        .value()
;

export const GRAPH_TYPE: Record<GraphType, GraphBuilder> = {
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
