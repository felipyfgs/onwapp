<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, RefreshCw } from 'lucide-vue-next'
import { useSessions, type Session } from '~/lib/api/sessions'
import SessionCard from '~/components/sessions/SessionCard.vue'
import CreateSessionDialog from '~/components/sessions/CreateSessionDialog.vue'

const { fetchSessions } = useSessions()
const sessions = ref<Session[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const showCreateDialog = ref(false)

const loadSessions = async () => {
  try {
    loading.value = true
    error.value = null
    const response = await fetchSessions()
    sessions.value = response.sessions || []
  } catch (err: any) {
    error.value = err.message || 'Failed to load sessions'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadSessions()
})

const handleSessionCreated = () => {
  showCreateDialog.value = false
  loadSessions()
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <div class="border-b bg-card">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold">WhatsApp Sessions</h1>
            <p class="text-sm text-muted-foreground mt-1">
              Manage your WhatsApp connections
            </p>
          </div>
          <div class="flex gap-2">
            <Button 
              variant="outline" 
              size="icon"
              @click="loadSessions"
              :disabled="loading"
            >
              <RefreshCw :class="{ 'animate-spin': loading }" class="h-4 w-4" />
            </Button>
            <Button @click="showCreateDialog = true">
              <Plus class="h-4 w-4 mr-2" />
              New Session
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="container mx-auto px-4 py-6">
      <!-- Loading State -->
      <div v-if="loading && sessions.length === 0" class="flex items-center justify-center py-12">
        <div class="text-center">
          <RefreshCw class="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p class="text-sm text-muted-foreground mt-2">Loading sessions...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="flex items-center justify-center py-12">
        <Card class="max-w-md w-full">
          <CardHeader>
            <CardTitle class="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-sm">{{ error }}</p>
            <Button @click="loadSessions" class="mt-4" variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>

      <!-- Empty State -->
      <div v-else-if="sessions.length === 0" class="flex items-center justify-center py-12">
        <Card class="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle>No Sessions Yet</CardTitle>
            <CardDescription>
              Create your first WhatsApp session to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button @click="showCreateDialog = true" class="w-full">
              <Plus class="h-4 w-4 mr-2" />
              Create Session
            </Button>
          </CardContent>
        </Card>
      </div>

      <!-- Sessions Grid -->
      <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SessionCard
          v-for="session in sessions"
          :key="session.session_id"
          :session="session"
          @refresh="loadSessions"
        />
      </div>
    </div>

    <!-- Create Session Dialog -->
    <CreateSessionDialog
      v-model:open="showCreateDialog"
      @created="handleSessionCreated"
    />
  </div>
</template>
