import { NextResponse } from 'next/server';
import ImageKit from 'imagekit';

export async function POST(req: Request) {
    try {
        const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
        const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
        const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

        if (!publicKey || !privateKey || !urlEndpoint) {
            console.error("Missing ImageKit config");
            return NextResponse.json({ error: 'Server misconfigured (Missing ImageKit Keys)' }, { status: 500 });
        }

        const imagekit = new ImageKit({
            publicKey,
            privateKey,
            urlEndpoint
        });

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        const result = await imagekit.upload({
            file: buffer,
            fileName: `${Date.now()}_${file.name}`,
            folder: '/chat-images'
        });

        return NextResponse.json({ url: result.url, fileId: result.fileId });
    } catch (error) {
        console.error("ImageKit upload error:", error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
