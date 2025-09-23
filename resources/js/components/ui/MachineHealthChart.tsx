"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts"

interface HealthStats {
    health_score: number;
    total_items: number;
    ok_count: number;
    warning_count: number;
    critical_count: number;
}

interface MachineHealthChartProps {
    stats: HealthStats | null;
    period: 'Today' | 'This Week' | 'This Month';
}

const chartConfig = {
    ok: { label: "OK", color: "hsl(var(--chart-2))" },
    warning: { label: "Warning", color: "hsl(var(--chart-3))" },
    critical: { label: "Critical", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig

export function MachineHealthChart({ stats, period }: MachineHealthChartProps) {
    if (!stats || typeof stats.total_items !== 'number' || stats.total_items === 0) {
        return (
            // ACTION: Se aplica el mismo estilo de fondo transparente al estado de "sin datos"
            <Card className="flex flex-col border-0 bg-transparent shadow-none">
                <CardHeader className="items-center pb-0">
                    <CardTitle>Machine Health Score</CardTitle>
                    <CardDescription>{period}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 items-center justify-center pb-0">
                    <div className="mx-auto flex aspect-square w-full max-w-[250px] items-center justify-center">
                        <svg viewBox="0 0 100 100" className="h-full w-full">
                            <text x="50" y="50" textAnchor="middle" dominantBaseline="middle">
                                <tspan x="50" dy="-0.6em" className="fill-foreground text-2xl font-bold">100%</tspan>
                                <tspan x="50" dy="1.2em" className="fill-muted-foreground">Health</tspan>
                            </text>
                        </svg>
                    </div>
                </CardContent>
                <CardFooter className="flex-col gap-2 text-sm">
                    <div className="flex items-center gap-2 font-medium leading-none">
                        No inspection data for this period.
                    </div>
                    <div className="leading-none text-muted-foreground">
                        Health is considered optimal.
                    </div>
                </CardFooter>
            </Card>
        );
    }

    const chartData = [
        {
            name: 'inspections',
            total_items: stats.total_items,
            ok: stats.ok_count,
            warning: stats.warning_count,
            critical: stats.critical_count,
        },
    ]

    return (
        // ACTION: Se cambia el fondo de la tarjeta a transparente y se eliminan el borde y la sombra.
        <Card className="flex flex-col border-0 bg-transparent shadow-none">
            <CardHeader className="items-center pb-0">
                <CardTitle>Machine Health Score</CardTitle>
                <CardDescription>{period}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 items-center pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square w-full max-w-[250px]"
                >
                    <RadialBarChart
                        data={chartData}
                        endAngle={180}
                        innerRadius={80}
                        outerRadius={130}
                    >
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        return (
                                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) - 16}
                                                    className="fill-foreground text-2xl font-bold"
                                                >
                                                    {stats.health_score}%
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 4}
                                                    className="fill-muted-foreground"
                                                >
                                                    Health
                                                </tspan>
                                            </text>
                                        )
                                    }
                                }}
                            />
                        </PolarRadiusAxis>
                        <RadialBar
                            background
                            dataKey="total_items"
                            cornerRadius={5}
                            className="fill-white"
                        />
                        <RadialBar dataKey="critical" stackId="a" cornerRadius={5} fill="hsl(0 72.2% 50.6%)" />
                        <RadialBar dataKey="warning" stackId="a" cornerRadius={5} fill="hsl(47.9 95.8% 53.1%)" />
                        <RadialBar dataKey="ok" stackId="a" cornerRadius={5} fill="hsl(142.1 76.2% 36.3%)" />

                    </RadialBarChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 font-medium leading-none">
                    Based on {stats.total_items} inspection points
                </div>
                <div className="leading-none text-muted-foreground">
                    {stats.ok_count} OK, {stats.warning_count} Warnings, {stats.critical_count} Critical
                </div>
            </CardFooter>
        </Card>
    )
}

