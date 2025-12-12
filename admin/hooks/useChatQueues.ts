import { useState, useEffect } from "react";
import { getQueues, type Queue } from "@/lib/api";

export function useChatQueues() {
  const [queues, setQueues] = useState<Queue[]>([]);

  useEffect(() => {
    getQueues()
      .then((response) => setQueues(response.data || []))
      .catch(() => {
        // Handle error appropriately
        setQueues([]);
      });
  }, []);

  return { queues };
}
