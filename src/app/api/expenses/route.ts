import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: userAuth } = await supabase.auth.getUser();
    if (!userAuth.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { data: expenses, error } = await supabase
      .from('Expenses')
      .select('*')
      .eq('user_id', userAuth.user.id)
      .order('Expense_Date', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, expenses });
  } catch (error: any) {
    console.error('Expenses API GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { category, amount, date, description } = body;

    const { data: userAuth } = await supabase.auth.getUser();
    if (!userAuth.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    if (!category || !amount || !date) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('Expenses')
      .insert({
        user_id: userAuth.user.id,
        Category: category,
        Amount: amount,
        Expense_Date: date,
        Description: description || ''
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, expenseId: data.Expense_ID });
  } catch (error: any) {
    console.error('Expenses API POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });

    const { error } = await supabase.from('Expenses').delete().eq('Expense_ID', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Expenses API DELETE Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
