import ApexCharts, { ApexOptions } from 'apexcharts';
import _ from 'lodash';
import { useState, useEffect, useMemo } from 'react';

export type Data = [number, number];

interface Props {
    data: ApexAxisChartSeries
}

export default function Chart({data}: Props) {

    const [ref, setRef] = useState<HTMLDivElement | null>();
    const chart = useChart(ref);

    useEffect(() => {

        let min: number | undefined = undefined;
        let max: number | undefined = undefined;

        if (data.length) {
            min = _.map(data, ({data: d}) => (d as [number, number][])[0][0])[0];
            max = _.map(data, ({data: d}) => (d as [number, number][])[d.length-1][0])[data.length-1];
        }

        chart?.updateOptions({
            series: data,
            xaxis: { min, max },
        } as ApexOptions)
    }, [chart, data]);

    chart?.render();

    return <div ref={setRef} />;
}

const useChart = (element: HTMLDivElement | null | undefined) => useMemo(() => {

    if (!element) {
        return null;
    }

    const chartOptions: ApexOptions = {
        theme: {
            mode: 'dark',
            palette: 'palette1'
        },
        chart: {
            type: 'line',
            background: 'rgb(0, 0, 0, 0)',
            width: '100%',
            animations: {
                enabled: false
            }
        },
        series: [{
            data: []
        }],
        xaxis: {
            type: 'datetime',
        },
        grid: {
            strokeDashArray: 2,
            xaxis: {
                lines: {
                    show: true
                }
            },
            yaxis: {
                lines: {
                    show: false
                }
            }
        },
        stroke: {
            width: 1.75
        }
    };

    const chart = new ApexCharts(element, chartOptions);
    return chart;

}, [element]);