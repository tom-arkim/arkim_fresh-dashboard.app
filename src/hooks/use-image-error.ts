import { useAuth } from "@/components/contexts/AuthContext";

export default function useImageError() {
    const { refreshContext } = useAuth();
    async function handleImageError(url: string) {
        try {
            const res = await fetch(url, { method: 'HEAD', credentials: 'include' });
            if (res.status === 403) refreshContext();
        } catch { }
    }

    return {
        handleImageError
    }
}