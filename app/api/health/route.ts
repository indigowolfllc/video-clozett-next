import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    // 環境変数チェック
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Missing Supabase environment variables'
        },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    // 軽量DBチェック
    const { error } = await supabase
      .from('analysis_results')
      .select('id')
      .limit(1)

    if (error) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Database query failed',
          detail: error.message
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    )

  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Unexpected server error',
        detail: err?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}