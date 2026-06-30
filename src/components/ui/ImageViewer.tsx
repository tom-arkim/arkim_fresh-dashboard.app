'use client'

import { ZoomIn, ZoomOut } from 'lucide-react'
import { PhotoProvider, PhotoView } from 'react-photo-view'
import 'react-photo-view/dist/react-photo-view.css'

// ─── Shared provider ──────────────────────────────────────────────────────────
// Wrap a group of images in this so they share one viewer context.
// All zoom / close / keyboard interactions work correctly within a single
// PhotoProvider instance.
export function ImageViewerProvider({
    children,
    onVisibleChange,
}: {
    children: React.ReactNode
    onVisibleChange?: (visible: boolean) => void
}) {
    return (
        <PhotoProvider
            maskOpacity={0.9}
            speed={() => 300}
            onVisibleChange={onVisibleChange}
            toolbarRender={({ scale, onScale }) => (
                <div className="flex flex-row items-center gap-5 mr-5">
                    <button type="button" onClick={() => onScale(scale + 0.3)}>
                        <ZoomIn className="size-4" />
                    </button>
                    <button type="button" onClick={() => onScale(scale - 0.3)}>
                        <ZoomOut className="size-4" />
                    </button>
                </div>
            )}
        >
            {children}
        </PhotoProvider>
    )
}

// ─── Single image ─────────────────────────────────────────────────────────────
// Use inside an ImageViewerProvider. The `download` prop adds a download button
// but requires the provider to supply the URL — pass it via the parent instead
// if you need per-image download links.
export default function ImageViewer({
    url,
    children,
}: {
    url: string
    children: React.ReactElement
}) {
    return <PhotoView src={url}>{children}</PhotoView>
}