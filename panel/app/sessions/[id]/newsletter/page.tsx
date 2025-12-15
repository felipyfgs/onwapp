'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Users, Radio, RefreshCw, Settings } from 'lucide-react';
import { newsletterService } from '@/lib/api/index';
import type { Newsletter } from '@/lib/types/api';

export default function NewsletterPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const [search, setSearch] = useState('');
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNewsletters();
  }, [sessionId]);

  const loadNewsletters = async () => {
    setLoading(true);
    try {
      const response = await newsletterService.getNewsletters(sessionId);
      setNewsletters(response || []);
    } catch (error) {
      console.error('Failed to load newsletters:', error);
      setNewsletters([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredNewsletters = newsletters.filter(newsletter =>
    newsletter.name.toLowerCase().includes(search.toLowerCase()) ||
    (newsletter.description && newsletter.description.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Newsletter</h2>
          <p className="text-muted-foreground">Gerencie seus canais do WhatsApp</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Canal
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar canais..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filteredNewsletters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Radio className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold">Nenhum canal encontrado</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {search ? 'Tente buscar por outro termo' : 'Crie seu primeiro canal para começar'}
          </p>
          {!search && (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Criar Canal
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredNewsletters.map((newsletter) => (
            <Card key={newsletter.jid} className="hover:bg-accent/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                      <Radio className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {newsletter.name}
                        <Badge variant={newsletter.isFollowing ? 'default' : 'secondary'}>
                          {newsletter.isFollowing ? 'Seguindo' : 'Não segue'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{newsletter.description}</CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{newsletter.subscribers.toLocaleString('pt-BR')} inscritos</span>
                  </div>
                  <div className="flex gap-2 ml-auto">
                    <Button variant="outline" size="sm">
                      Ver Inscritos
                    </Button>
                    <Button size="sm">
                      Nova Postagem
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
