import { useState, useCallback } from "react";
import { getBlocklist, updateBlocklist } from "@/lib/api";
import { toast } from "sonner";

export function useBlocklist(sessionId: string) {
  const [blocklist, setBlocklist] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [blockPhone, setBlockPhone] = useState("");

  const fetchBlocklist = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const list = await getBlocklist(sessionId);
      setBlocklist(list);
    } catch (error) {
      toast.error("Failed to fetch blocklist");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const handleBlock = useCallback(async (phone?: string) => {
    const phoneToBlock = phone || blockPhone;
    if (!sessionId || !phoneToBlock) return;

    try {
      await updateBlocklist(sessionId, phoneToBlock, "block");
      toast.success("Contact blocked");
      setBlockPhone("");
      fetchBlocklist();
    } catch (error) {
      toast.error("Failed to block contact");
    }
  }, [sessionId, blockPhone, fetchBlocklist]);

  const handleUnblock = useCallback(async (jid: string) => {
    if (!sessionId) return;
    try {
      await updateBlocklist(sessionId, jid, "unblock");
      toast.success("Contact unblocked");
      fetchBlocklist();
    } catch (error) {
      toast.error("Failed to unblock contact");
    }
  }, [sessionId, fetchBlocklist]);

  return {
    blocklist,
    loading,
    blockPhone,
    setBlockPhone,
    fetchBlocklist,
    handleBlock,
    handleUnblock,
  };
}
