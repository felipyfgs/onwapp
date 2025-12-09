<script setup lang="ts">
import { ref } from 'vue'
import { MessageSquare, Users, Phone, Settings } from 'lucide-vue-next'

const inputValue = ref('')
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Hero Section -->
    <div class="border-b bg-gradient-to-br from-primary/10 via-background to-background">
      <div class="container mx-auto px-4 py-16 text-center">
        <div class="inline-flex items-center justify-center p-2 mb-4 bg-primary/10 rounded-full">
          <MessageSquare class="h-12 w-12 text-primary" />
        </div>
        <h1 class="text-5xl font-bold tracking-tight mb-4">OnWapp Dashboard</h1>
        <p class="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          WhatsApp API Bridge - Manage your WhatsApp connections, send messages, and integrate with your applications
        </p>
        <div class="flex gap-4 justify-center">
          <NuxtLink to="/sessions">
            <Button size="lg">
              <Phone class="h-4 w-4 mr-2" />
              Manage Sessions
            </Button>
          </NuxtLink>
          <Button size="lg" variant="outline">
            <Settings class="h-4 w-4 mr-2" />
            Documentation
          </Button>
        </div>
      </div>
    </div>

    <!-- Features Section -->
    <div class="container mx-auto px-4 py-12">
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card class="hover:shadow-lg transition-shadow cursor-pointer">
          <NuxtLink to="/sessions" class="block">
            <CardHeader>
              <div class="flex items-center gap-3">
                <div class="p-2 bg-primary/10 rounded-lg">
                  <Phone class="h-6 w-6 text-primary" />
                </div>
                <CardTitle class="text-lg">Sessions</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p class="text-sm text-muted-foreground">
                Create and manage WhatsApp sessions with QR code authentication
              </p>
            </CardContent>
          </NuxtLink>
        </Card>

        <Card class="hover:shadow-lg transition-shadow opacity-60">
          <CardHeader>
            <div class="flex items-center gap-3">
              <div class="p-2 bg-muted rounded-lg">
                <MessageSquare class="h-6 w-6 text-muted-foreground" />
              </div>
              <CardTitle class="text-lg">Messages</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p class="text-sm text-muted-foreground">
              Send text, media, and interactive messages
            </p>
            <Badge variant="outline" class="mt-2">Coming Soon</Badge>
          </CardContent>
        </Card>

        <Card class="hover:shadow-lg transition-shadow opacity-60">
          <CardHeader>
            <div class="flex items-center gap-3">
              <div class="p-2 bg-muted rounded-lg">
                <Users class="h-6 w-6 text-muted-foreground" />
              </div>
              <CardTitle class="text-lg">Contacts</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p class="text-sm text-muted-foreground">
              Manage contacts and groups
            </p>
            <Badge variant="outline" class="mt-2">Coming Soon</Badge>
          </CardContent>
        </Card>

        <Card class="hover:shadow-lg transition-shadow opacity-60">
          <CardHeader>
            <div class="flex items-center gap-3">
              <div class="p-2 bg-muted rounded-lg">
                <Settings class="h-6 w-6 text-muted-foreground" />
              </div>
              <CardTitle class="text-lg">Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p class="text-sm text-muted-foreground">
              Configure webhooks and API settings
            </p>
            <Badge variant="outline" class="mt-2">Coming Soon</Badge>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Quick Start -->
    <div class="container mx-auto px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Quick Start Guide</CardTitle>
          <CardDescription>Get started with OnWapp in 3 simple steps</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex gap-4">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
              1
            </div>
            <div>
              <h3 class="font-semibold mb-1">Create a Session</h3>
              <p class="text-sm text-muted-foreground">
                Go to Sessions page and create a new WhatsApp session with a unique ID
              </p>
            </div>
          </div>
          <Separator />
          <div class="flex gap-4">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
              2
            </div>
            <div>
              <h3 class="font-semibold mb-1">Scan QR Code</h3>
              <p class="text-sm text-muted-foreground">
                Open WhatsApp on your phone and scan the QR code to connect
              </p>
            </div>
          </div>
          <Separator />
          <div class="flex gap-4">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
              3
            </div>
            <div>
              <h3 class="font-semibold mb-1">Start Using the API</h3>
              <p class="text-sm text-muted-foreground">
                Use the API endpoints to send messages and manage your WhatsApp
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
