import { NextResponse } from 'next/server';

export async function POST(req: Request) {
return NextResponse.json({ status: "Video CloZett API is active" });
}

export async function GET() {
return NextResponse.json({ status: "Video CloZett API is active" });
}