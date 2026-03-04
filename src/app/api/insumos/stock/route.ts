import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-guard';
import { adjustStock } from '@/lib/services/insumos';
import { stockAdjustSchema, type StockAdjustInput } from '@/lib/validations/insumo';

export const POST = withAuth<StockAdjustInput>('update', 'insumos', async (_req, _session, body) => {
  try {
    const result = await adjustStock(body!.insumoId, body!.sitioId, body!.cantidad);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Stock no puede ser negativo') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}, { schema: stockAdjustSchema });
