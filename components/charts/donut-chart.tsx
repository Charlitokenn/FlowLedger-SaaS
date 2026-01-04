"use client"

import * as React from "react"
import { TrendingUp, TrendingDown } from "lucide-react"
import { Label, Pie, PieChart } from "recharts"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"

interface DonutChartData {
    name: string
    value: number
    fill: string
}

interface DonutChartProps {
    data: DonutChartData[]
    title?: string
    description?: string
    valueLabel?: string
    footerText?: string
    trendPercentage?: number
    trendLabel?: string
    showTrend?: boolean
    innerRadius?: number
    maxHeight?: string
}

export function DonutChart({
                               data,
                               valueLabel = "Total",
                               trendPercentage,
                               innerRadius = 60,
                               maxHeight = "250px",
                           }: DonutChartProps) {
    const totalValue = React.useMemo(() => {
        return data.reduce((acc, curr) => acc + curr.value, 0)
    }, [data])

    const chartConfig = React.useMemo(() => {
        const config: ChartConfig = {
            value: {
                label: valueLabel,
            },
        }
        data.forEach((item, index) => {
            config[item.name] = {
                label: item.name,
                color: item.fill || `var(--chart-${index + 1})`,
            }
        })
        return config
    }, [data, valueLabel])

    const isTrendingUp = trendPercentage ? trendPercentage > 0 : true
    const TrendIcon = isTrendingUp ? TrendingUp : TrendingDown

    return <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square"
            style={{maxHeight}}
        >
            <PieChart>
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel/>}
                />
                <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={innerRadius}
                    strokeWidth={5}
                >
                    <Label
                        content={({viewBox}) => {
                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                return (
                                    <text
                                        x={viewBox.cx}
                                        y={viewBox.cy}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                    >
                                        <tspan
                                            x={viewBox.cx}
                                            y={viewBox.cy}
                                            className="fill-foreground text-3xl font-bold"
                                        >
                                            {totalValue.toLocaleString()}
                                        </tspan>
                                        <tspan
                                            x={viewBox.cx}
                                            y={(viewBox.cy || 0) + 24}
                                            className="fill-muted-foreground"
                                        >
                                            {valueLabel}
                                        </tspan>
                                    </text>
                                )
                            }
                        }}
                    />
                </Pie>
            </PieChart>
        </ChartContainer>
}

// Example usage
export default function Demo() {
    const chartData = [
        { name: "Chrome", value: 275, fill: "hsl(var(--chart-1))" },
        { name: "Safari", value: 200, fill: "hsl(var(--chart-2))" },
        { name: "Firefox", value: 287, fill: "hsl(var(--chart-3))" },
        { name: "Edge", value: 173, fill: "hsl(var(--chart-4))" },
        { name: "Other", value: 190, fill: "hsl(var(--chart-5))" },
    ]

    return (
        <div className="p-8">
            <DonutChart
                data={chartData}
                title="Browser Usage"
                description="January - June 2024"
                valueLabel="Visitors"
                trendPercentage={5.2}
                trendLabel="this month"
                footerText="Showing total visitors for the last 6 months"
            />
        </div>
    )
}