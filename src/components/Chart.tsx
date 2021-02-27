import ApexCharts, { ApexOptions } from 'apexcharts';
import { useState, useEffect, useMemo } from 'react';

export type Data = [number, number];

interface Props {
    series: ApexAxisChartSeries
}

export default function Chart({series}: Props) {

    const [ref, setRef] = useState<HTMLDivElement | null>();
    const chart = useChart(ref);

    useEffect(() => { chart?.updateOptions({series} as ApexOptions); }, [chart, series]);

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
        yaxis: {
            opposite: true,
            labels: {
                formatter: value => { return value.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' }) }
            }
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
                    show: true
                }
            }
        },
        stroke: {
            width: 1.75
        }
    };

    const chart = new ApexCharts(element, chartOptions);
    chart.render();
    return chart;

}, [element]);