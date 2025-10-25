import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename
    const filePath = path.join(process.cwd(), 'temp', filename)
    
    if (!existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 })
    }
    
    const fileBuffer = await readFile(filePath)
    const extension = path.extname(filename).toLowerCase()
    
    let contentType = 'application/octet-stream'
    if (extension === '.mp4') {
      contentType = 'video/mp4'
    } else if (extension === '.jpg' || extension === '.jpeg') {
      contentType = 'image/jpeg'
    } else if (extension === '.srt') {
      contentType = 'text/plain'
    }
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
    
  } catch (error) {
    console.error('Error serving file:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}