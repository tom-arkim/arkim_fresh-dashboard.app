import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { Button } from '@/components/ui/shadcn/button';
import {
    ChevronLeft,
    ChevronRight,
    CircleAlert,
    Download,
    Loader2,
    Minus,
    Plus,
    RotateCcw,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TooltipIconButton } from '../ui/TooltipIconButton';
import { Skeleton } from '../ui/shadcn/skeleton';
import { t } from 'i18next';

// ---------------------------------------------------------------------------
// pdfjs-dist — loaded dynamically to avoid SSR issues
// ---------------------------------------------------------------------------
type PdfjsLib = typeof import('pdfjs-dist');
let _pdfjs: PdfjsLib | null = null;

async function getPdfjs(): Promise<PdfjsLib> {
    if (_pdfjs) return _pdfjs;
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.mjs',
        import.meta.url,
    ).toString();
    _pdfjs = pdfjs;
    return pdfjs;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface PDFPreviewerProps {
    url: string;
    open: boolean;
    onClose: () => void;
    filename?: string;
    fetchPdf?: (url: string) => Promise<Blob>;
    downloadable?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 4;
const ZOOM_DEFAULT = 1;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function PDFPreviewer({
    url,
    open,
    onClose,
    filename = 'document.pdf',
    fetchPdf,
    downloadable = false
}: PDFPreviewerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);
    const renderTaskRef = useRef<import('pdfjs-dist').RenderTask | null>(null);
    const isRenderingRef = useRef(false);
    const pendingRenderRef = useRef<{ page: number; scale: number } | null>(null);
    const pdfDocRef = useRef<import('pdfjs-dist').PDFDocumentProxy | null>(null);
    const objectUrlRef = useRef<string | null>(null);
    const zoomRef = useRef(ZOOM_DEFAULT);
    const dragRef = useRef<{ active: boolean; startX: number; startY: number; scrollX: number; scrollY: number }>({
        active: false, startX: 0, startY: 0, scrollX: 0, scrollY: 0,
    });
    const lastCanvasSizeRef = useRef<{ width: number; height: number } | null>(null);

    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [zoom, setZoom] = useState(ZOOM_DEFAULT);
    const [fitWidth, setFitWidth] = useState(true);
    const [status, setStatus] = useState<'idle' | 'loading' | 'rendering' | 'ready' | 'error'>('loading');
    const [errorMsg, setErrorMsg] = useState('');
    const [blobUrl, setBlobUrl] = useState<string | null>(null);

    // Keep zoomRef in sync
    useEffect(() => { zoomRef.current = zoom; }, [zoom]);

    // ------------------------------------------------------------------
    // Core render — queues if already rendering to avoid same-canvas error
    // ------------------------------------------------------------------
    const renderPage = useCallback(async (pageNum: number, scale: number) => {
        const doc = pdfDocRef.current;
        const canvas = canvasRef.current;
        if (!doc || !canvas) return;

        if (isRenderingRef.current) {
            pendingRenderRef.current = { page: pageNum, scale };
            renderTaskRef.current?.cancel();
            return;
        }

        isRenderingRef.current = true;
        setStatus('rendering');

        try {
            const page = await doc.getPage(pageNum);
            const viewport = page.getViewport({ scale });

            canvas.width = viewport.width;
            canvas.height = viewport.height;
            lastCanvasSizeRef.current = { width: viewport.width, height: viewport.height };

            const ctx = canvas.getContext('2d')!;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const renderTask = page.render({ canvasContext: ctx, viewport, canvas });
            renderTaskRef.current = renderTask;

            await renderTask.promise;
            renderTaskRef.current = null;
            isRenderingRef.current = false;
            setStatus('ready');
        } catch (err: any) {
            isRenderingRef.current = false;
            renderTaskRef.current = null;
            if (err?.name !== 'RenderingCancelledException') {
                setErrorMsg(t('pdfViewer.renderFailed'));
                setStatus('error');
            }
        } finally {
            if (pendingRenderRef.current) {
                const next = pendingRenderRef.current;
                pendingRenderRef.current = null;
                renderPage(next.page, next.scale);
            }
        }
    }, []);

    // ------------------------------------------------------------------
    // Compute fit-width scale based on container width
    // ------------------------------------------------------------------
    const getFitWidthScale = useCallback(async (): Promise<number> => {
        const doc = pdfDocRef.current;
        const container = viewportRef.current;
        if (!doc || !container) return ZOOM_DEFAULT;
        const page = await doc.getPage(1);
        const naturalViewport = page.getViewport({ scale: 1 });
        const containerWidth = container.clientWidth - 48;
        return Math.max(ZOOM_MIN, containerWidth / naturalViewport.width);
    }, []);

    // ------------------------------------------------------------------
    // Fetch PDF → Blob → objectURL
    // ------------------------------------------------------------------
    useEffect(() => {
        if (!open || !url) return;
        let cancelled = false;
        setStatus('loading');
        setErrorMsg('');

        (async () => {
            try {
                let blob: Blob;
                if (fetchPdf) {
                    blob = await fetchPdf(url);
                } else {
                    const res = await fetch(url);
                    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                    blob = await res.blob();
                }
                if (cancelled) return;
                if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
                const objUrl = URL.createObjectURL(blob);
                objectUrlRef.current = objUrl;
                setBlobUrl(objUrl);
            } catch (err: any) {
                if (!cancelled) {
                    setErrorMsg(t('pdfViewer.fetchFailed'));
                    setStatus('error');
                }
            }
        })();

        return () => { cancelled = true; };
    }, [open, url, fetchPdf]);

    // ------------------------------------------------------------------
    // Parse PDF document once blob is ready
    // ------------------------------------------------------------------
    useEffect(() => {
        if (!blobUrl) return;
        let cancelled = false;

        (async () => {
            try {
                const pdfjs = await getPdfjs();
                const doc = await pdfjs.getDocument(blobUrl).promise;
                if (cancelled) { doc.destroy(); return; }
                if (pdfDocRef.current) pdfDocRef.current.destroy();
                pdfDocRef.current = doc;
                setTotalPages(doc.numPages);
                setCurrentPage(1);
                const page0 = await doc.getPage(1);
                const naturalVp = page0.getViewport({ scale: 1 });
                const containerWidth = viewportRef.current ? viewportRef.current.clientWidth - 48 : 0;
                const initialScale = containerWidth > 0
                    ? Math.max(ZOOM_MIN, containerWidth / naturalVp.width)
                    : ZOOM_DEFAULT;
                setZoom(initialScale);
                zoomRef.current = initialScale;
                setStatus('rendering');
            } catch (err: any) {
                if (!cancelled) {
                    setErrorMsg(t('pdfViewer.parseFailed'));
                    setStatus('error');
                }
            }
        })();

        return () => { cancelled = true; };
    }, [blobUrl]);

    // Kick off render on initial 'rendering' status
    useEffect(() => {
        if (status === 'rendering') {
            renderPage(currentPage, zoomRef.current);
        }
    }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

    // Re-render on page change
    useEffect(() => {
        if (status === 'ready') {
            renderPage(currentPage, zoomRef.current);
        }
    }, [currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

    // Re-render on zoom change
    useEffect(() => {
        if (status === 'ready' || status === 'rendering') {
            renderPage(currentPage, zoom);
        }
    }, [zoom]); // eslint-disable-line react-hooks/exhaustive-deps

    // ------------------------------------------------------------------
    // Cleanup on close
    // ------------------------------------------------------------------
    useEffect(() => {
        if (!open) {
            renderTaskRef.current?.cancel();
            pendingRenderRef.current = null;
            pdfDocRef.current?.destroy();
            pdfDocRef.current = null;
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
                objectUrlRef.current = null;
            }
            setBlobUrl(null);
            isRenderingRef.current = false;
            setStatus('loading');
            setCurrentPage(1);
            setZoom(ZOOM_DEFAULT);
            zoomRef.current = ZOOM_DEFAULT;
            lastCanvasSizeRef.current = null;
            setTotalPages(0);
            setErrorMsg('');
            setFitWidth(false);
        }
    }, [open]);

    // ------------------------------------------------------------------
    // Keyboard shortcuts
    // ------------------------------------------------------------------
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if ((e.target as HTMLElement).tagName === 'INPUT') return;
            switch (e.key) {
                case 'ArrowRight':
                case 'ArrowDown':
                    e.preventDefault();
                    setCurrentPage(p => Math.min(totalPages, p + 1));
                    break;
                case 'ArrowLeft':
                case 'ArrowUp':
                    e.preventDefault();
                    setCurrentPage(p => Math.max(1, p - 1));
                    break;
                case '+':
                case '=':
                    e.preventDefault();
                    applyZoom(d => Math.min(ZOOM_MAX, Math.round((d + ZOOM_STEP) * 100) / 100));
                    break;
                case '-':
                    e.preventDefault();
                    applyZoom(d => Math.max(ZOOM_MIN, Math.round((d - ZOOM_STEP) * 100) / 100));
                    break;
                case 'f':
                case 'F':
                    e.preventDefault();
                    handleToggleFitWidth();
                    break;
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, totalPages]);

    // ------------------------------------------------------------------
    // Drag to pan — only when ready and zoomed in past fit-width
    // ------------------------------------------------------------------
    useEffect(() => {
        const el = viewportRef.current;
        if (!el) return;

        const canDrag = () => status === 'ready' && blobUrl !== null;

        const onMouseDown = (e: MouseEvent) => {
            if (e.button !== 0 || !canDrag()) return;
            dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, scrollX: el.scrollLeft, scrollY: el.scrollTop };
            el.style.cursor = 'grabbing';
            el.style.userSelect = 'none';
        };
        const onMouseMove = (e: MouseEvent) => {
            if (!dragRef.current.active) return;
            el.scrollLeft = dragRef.current.scrollX - (e.clientX - dragRef.current.startX);
            el.scrollTop = dragRef.current.scrollY - (e.clientY - dragRef.current.startY);
        };
        const onMouseUp = () => {
            if (!dragRef.current.active) return;
            dragRef.current.active = false;
            el.style.cursor = canDrag() ? 'grab' : '';
            el.style.userSelect = '';
        };

        el.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);

        // Set cursor based on current state
        el.style.cursor = canDrag() ? 'grab' : '';

        return () => {
            el.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            el.style.cursor = '';
        };
    }, [status, blobUrl]);

    // ------------------------------------------------------------------
    // Zoom helpers
    // ------------------------------------------------------------------
    const applyZoom = (updater: (prev: number) => number) => {
        setZoom(prev => {
            const next = updater(prev);
            zoomRef.current = next;
            return next;
        });
        setFitWidth(false);
    };

    const handleZoomIn = () => applyZoom(p => Math.min(ZOOM_MAX, Math.round((p + ZOOM_STEP) * 100) / 100));
    const handleZoomOut = () => applyZoom(p => Math.max(ZOOM_MIN, Math.round((p - ZOOM_STEP) * 100) / 100));
    const handleResetZoom = () => applyZoom(() => ZOOM_DEFAULT);

    const handleToggleFitWidth = useCallback(async () => {
        if (fitWidth) {
            setFitWidth(false);
            applyZoom(() => ZOOM_DEFAULT);
        } else {
            const scale = await getFitWidthScale();
            setFitWidth(true);
            setZoom(scale);
            zoomRef.current = scale;
        }
    }, [fitWidth, getFitWidthScale]);

    // ------------------------------------------------------------------
    // Page controls
    // ------------------------------------------------------------------
    const goTo = (page: number) => {
        const clamped = Math.max(1, Math.min(totalPages, page));
        if (clamped !== currentPage) setCurrentPage(clamped);
    };

    const handleDownload = () => {
        if (!objectUrlRef.current) return;
        const a = document.createElement('a');
        a.href = objectUrlRef.current;
        a.download = filename;
        a.click();
    };

    const handlePageInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const val = parseInt((e.target as HTMLInputElement).value, 10);
            if (!isNaN(val)) goTo(val);
        }
    };

    const isLoading = status === 'loading' || status === 'rendering';

    // ------------------------------------------------------------------
    // Render
    // ------------------------------------------------------------------
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                onOpenAutoFocus={(e) => e.preventDefault()}
                className="flex flex-col max-w-4xl w-[95vw] max-h-[96vh] bg-card [&>button]:hidden overflow-hidden"
            >
                <DialogTitle className='p-0' />
                <DialogDescription className='p-0' />

                {/* ── Toolbar ── */}
                <div className="flex flex-col items-start justify-between gap-5 -mt-10">

                    <div className='w-full flex flex-row items-center justify-between'>
                        {/* Filename */}
                        <span className="text-sm font-medium" title={filename}>
                            {filename}
                        </span>
                        {/* Close */}
                        <Button variant="ghost" size="icon"
                            className="h-8 w-8"
                            onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Controls */}
                    <div className="w-full flex flex-wrap items-center justify-around gap-0.5 bg-muted/70 p-1 rounded-md">

                        {/* Page nav */}
                        <TooltipIconButton variant="ghost" size="icon"
                            className="h-8 w-8"
                            onClick={() => goTo(currentPage - 1)}
                            disabled={currentPage <= 1 || isLoading || !blobUrl || status === 'error'}
                            tooltip={t('pdfViewer.previousPage')}>
                            <ChevronLeft className="h-4 w-4" />
                        </TooltipIconButton>

                        <div className="flex items-center gap-1 text-sm text-zinc-300 px-1">
                            <input
                                type="number" min={1} max={totalPages}
                                defaultValue={currentPage} key={currentPage}
                                onKeyDown={handlePageInput}
                                disabled={isLoading || !blobUrl || status === 'error'}
                                className="w-11 text-center bg-accent text-foreground rounded px-1 py-1 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="text-zinc-600">/</span>
                            <span className="text-zinc-400 min-w-[1.5rem] text-center">{totalPages || '—'}</span>
                        </div>

                        <TooltipIconButton variant="ghost" size="icon"
                            className="h-8 w-8"
                            onClick={() => goTo(currentPage + 1)}
                            disabled={currentPage >= totalPages || isLoading || !blobUrl || status === 'error'}
                            tooltip={t('pdfViewer.nextPage')}>
                            <ChevronRight className="h-4 w-4" />
                        </TooltipIconButton>

                        {/* Zoom */}
                        <TooltipIconButton variant="ghost" size="icon"
                            className="h-8 w-8"
                            onClick={handleZoomOut} disabled={zoom <= ZOOM_MIN || !blobUrl || status === 'error'} tooltip={t('pdfViewer.zoomOut')}>
                            <Minus className="h-4 w-4" />
                        </TooltipIconButton>

                        <button
                            onClick={handleResetZoom}
                            title="Reset zoom"
                            className="w-14 text-center text-sm tabular-nums"
                            disabled={!blobUrl || status === 'error'}
                        >
                            {Math.round(zoom * 100)}%
                        </button>

                        <TooltipIconButton variant="ghost" size="icon"
                            className="h-8 w-8"
                            onClick={handleZoomIn} disabled={zoom >= ZOOM_MAX || !blobUrl || status === 'error'} tooltip={t('pdfViewer.zoomIn')}>
                            <Plus className="h-4 w-4" />
                        </TooltipIconButton>

                        {/* Fit width */}
                        <TooltipIconButton variant="ghost" size="icon"
                            className={`h-8 w-8 ${fitWidth ? 'text-primary' : ''}`}
                            onClick={handleToggleFitWidth}
                            disabled={!blobUrl || status === 'error'}
                            tooltip={t('pdfViewer.fitToWidth')}>
                            <RotateCcw className="h-4 w-4" />
                        </TooltipIconButton>

                        {/* Download */}
                        {downloadable && <TooltipIconButton variant="ghost" size="icon"
                            className="h-8 w-8"
                            onClick={handleDownload} disabled={!blobUrl || status === 'error'} tooltip={t('pdfViewer.download')}>
                            <Download className="h-4 w-4" />
                        </TooltipIconButton>}
                    </div>
                </div>

                {/* Keyboard hint bar */}
                <div className="flex justify-center">
                    <p className="text-[11px] text-zinc-600 tracking-wide">
                        <b>← →</b> &nbsp;{t('pdfViewer.navigate')} &nbsp;·&nbsp; <b>+/−</b> &nbsp;{t('pdfViewer.zoom')} &nbsp;·&nbsp;<b>F</b> &nbsp;{t('pdfViewer.fitWidth')} &nbsp;·&nbsp; <b>Esc</b> &nbsp;{t('pdfViewer.close')}
                    </p>
                </div>

                {/* ── Viewport ── */}
                <div
                    ref={viewportRef}
                    className="flex-1 overflow-auto relative min-w-0 min-h-0"
                >
                    <div
                        className="relative flex items-start justify-center"
                        style={
                            lastCanvasSizeRef.current
                                ? {
                                    width: lastCanvasSizeRef.current.width,
                                    minHeight: lastCanvasSizeRef.current.height,
                                    margin: '0 auto',
                                }
                                : { width: '100%', minHeight: '60vh' }
                        }
                    >
                        {/* Skeleton — fills the stable area while loading or rendering */}
                        <Skeleton
                            className="absolute inset-0 w-full h-full rounded-md"
                            style={{ display: status !== 'ready' && status !== 'error' ? 'block' : 'none' }}
                        />

                        {/* Loader — floats above the skeleton */}
                        {isLoading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 pointer-events-none">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                    {status === 'loading' ? t('pdfViewer.fetchingDocument') : t('pdfViewer.renderingPage')}
                                </p>
                            </div>
                        )}

                        {/* Error state */}
                        {status === 'error' && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center w-full">
                                <CircleAlert className="size-9 text-destructive" strokeWidth={1} />
                                <p className="font-medium text-base text-destructive">{errorMsg}</p>
                            </div>
                        )}

                        {/* Canvas — always mounted; invisible during non-ready states */}
                        <canvas
                            ref={canvasRef}
                            className="relative z-10 mx-auto border-1 border-foreground/50 rounded-md"
                            style={{ display: status === 'ready' ? 'block' : 'none' }}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}