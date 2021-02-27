import { Button, ButtonGroup, Intent } from '@blueprintjs/core';
import _ from 'lodash';
import { DateTime } from 'luxon';
import { useCallback } from 'react';

export type DateGroupingType = 'daily' | 'weekly' | 'monthly';
export type DateGrouping = (date: Date) => Date;

interface Props {
    dateGroupingType: DateGroupingType;
    onChange: (selectedType: DateGroupingType) => void;
}

export default function DateGroupingPicker({dateGroupingType, onChange}: Props) {
    return <ButtonGroup>
        {
            _.map<DateGroupingType>(['daily', 'weekly', 'monthly'], (type: DateGroupingType) =>
                <Button
                    key={type}
                    intent={dateGroupingType === type ? Intent.PRIMARY : Intent.NONE}
                    onClick={useCallback(() => onChange(type), [])}
                >
                    {_.capitalize(type)}
                </Button>
            )
        }
    </ButtonGroup>
}

export const groupDaily = (date: Date): Date => DateTime.fromJSDate(date).startOf('day').toJSDate();

export const groupWeekly = (date: Date): Date => {
    let newDate = DateTime.fromJSDate(date);
    // move to end of the week (Friday):
    newDate = newDate.plus({ day: (12 - newDate.weekday) % 7 });
    return newDate.toJSDate();
}

export const groupMonthly = (date: Date): Date => DateTime.fromJSDate(date).endOf('month').toJSDate();

export const DATE_GROUPING: Record<DateGroupingType, DateGrouping> = {
    daily: groupDaily,
    weekly: groupWeekly,
    monthly: groupMonthly
};
