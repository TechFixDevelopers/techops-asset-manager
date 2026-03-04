'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  data: { fecha: string; count: number }[];
}

export function ChartMovimientosTimeline({ data }: Props) {
  if (!data.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Movimientos (ultimos 30 dias)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="fecha"
              tickFormatter={(v) => {
                const d = new Date(v + 'T00:00:00');
                return `${d.getDate()}/${d.getMonth() + 1}`;
              }}
              fontSize={12}
            />
            <YAxis allowDecimals={false} />
            <Tooltip
              labelFormatter={(v) => {
                const d = new Date(v + 'T00:00:00');
                return d.toLocaleDateString('es-AR');
              }}
            />
            <Line type="monotone" dataKey="count" stroke="#54A0D6" strokeWidth={2} name="Movimientos" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
