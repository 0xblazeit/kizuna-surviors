import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json(
      { message: 'Game over data retrieved successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve game over data' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Log the received data
    console.log('Game Over Stats Received:');
    console.log('Gold:', data.gold);
    console.log('Kills:', data.kills);
    console.log('Timestamp:', data.timestamp);
    
    // You could store this data in a database here
    
    return NextResponse.json(
      { 
        message: 'Game over data saved successfully',
        data: data 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to save game over data' },
      { status: 500 }
    );
  }
}