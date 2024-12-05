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
    
    // Convert UTC timestamp to EST
    const utcDate = new Date(data.timestamp);
    const estDate = new Date(utcDate.toLocaleString('en-US', {
      timeZone: 'America/New_York'
    }));
    
    // Format the EST date in a readable format
    const formattedDate = estDate.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    
    // Log the received data with formatted timestamp
    console.log('Game Over Stats Received:');
    console.log('Gold:', data.gold);
    console.log('Kills:', data.kills);
    console.log('Timestamp (EST):', formattedDate);
    
    // You could store this data in a database here
    
    return NextResponse.json(
      { 
        message: 'Game over data saved successfully',
        data: {
          ...data,
          formattedTimestamp: formattedDate
        }
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