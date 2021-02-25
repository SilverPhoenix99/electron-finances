import ApexCharts, { ApexOptions } from 'apexcharts';
import _ from 'lodash';
import { useState, useEffect, useMemo } from 'react';

export type Data = [number, number];

interface Props {
    series: ApexAxisChartSeries
}

export default function Chart({series}: Props) {

    const [ref, setRef] = useState<HTMLDivElement | null>();
    const chart = useChart(ref);

    useEffect(() => {

        let min: number | undefined = undefined;
        let max: number | undefined = undefined;

        if (series.length) {
            min = _.map(series, ({data}) => (data as [number, number][])[0][0])[0];
            max = _.map(series, ({data}) => (data as [number, number][])[data.length-1][0])[series.length-1];
        }

        chart?.updateOptions({ series: series, xaxis: { min, max } } as ApexOptions)
    }, [chart, series]);

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
        colors: [
            '#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0',
            '#81D4FA', '#4CAF50', '#F9CE1D', '#FF9800', '#A300D6',
        ],
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