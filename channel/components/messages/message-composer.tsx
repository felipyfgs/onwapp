"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Send,
  Image,
  FileAudio,
  FileVideo,
  FileText,
  MapPin,
  Contact,
  BarChart3,
  Loader2,
} from "lucide-react"
import {
  sendText,
  sendLocation,
  sendContact,
  sendPoll,
  sendMediaFile,
} from "@/lib/api/messages"

export function MessageComposer() {
  const sessionId = ""
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const [text, setText] = useState("")
  const [caption, setCaption] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")
  const [locationName, setLocationName] = useState("")
  const [address, setAddress] = useState("")
  const [contactName, setContactName] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [pollQuestion, setPollQuestion] = useState("")
  const [pollOptions, setPollOptions] = useState(["", ""])

  const clearForm = () => {
    setText("")
    setCaption("")
    setFile(null)
    setLatitude("")
    setLongitude("")
    setLocationName("")
    setAddress("")
    setContactName("")
    setContactPhone("")
    setPollQuestion("")
    setPollOptions(["", ""])
  }

  const handleSendText = async () => {
    if (!phone || !text) return
    setLoading(true)
    setResult(null)
    const res = await sendText(sessionId, { phone, text })
    setLoading(false)
    if (res.success) {
      setResult({
        success: true,
        message: `Message sent! ID: ${res.data?.messageId}`,
      })
      clearForm()
    } else {
      setResult({ success: false, message: res.error || "Failed to send" })
    }
  }

  const handleSendMedia = async (
    type: "image" | "audio" | "video" | "document"
  ) => {
    if (!phone || !file) return
    setLoading(true)
    setResult(null)
    const res = await sendMediaFile(sessionId, type, file, {
      phone,
      caption: caption || undefined,
      filename: type === "document" ? file.name : undefined,
    })
    setLoading(false)
    if (res.success) {
      setResult({
        success: true,
        message: `${type} sent! ID: ${res.data?.messageId}`,
      })
      clearForm()
    } else {
      setResult({ success: false, message: res.error || "Failed to send" })
    }
  }

  const handleSendLocation = async () => {
    if (!phone || !latitude || !longitude) return
    setLoading(true)
    setResult(null)
    const res = await sendLocation(sessionId, {
      phone,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      name: locationName || undefined,
      address: address || undefined,
    })
    setLoading(false)
    if (res.success) {
      setResult({
        success: true,
        message: `Location sent! ID: ${res.data?.messageId}`,
      })
      clearForm()
    } else {
      setResult({ success: false, message: res.error || "Failed to send" })
    }
  }

  const handleSendContact = async () => {
    if (!phone || !contactName || !contactPhone) return
    setLoading(true)
    setResult(null)
    const res = await sendContact(sessionId, { phone, contactName, contactPhone })
    setLoading(false)
    if (res.success) {
      setResult({
        success: true,
        message: `Contact sent! ID: ${res.data?.messageId}`,
      })
      clearForm()
    } else {
      setResult({ success: false, message: res.error || "Failed to send" })
    }
  }

  const handleSendPoll = async () => {
    const validOptions = pollOptions.filter((o) => o.trim())
    if (!phone || !pollQuestion || validOptions.length < 2) return
    setLoading(true)
    setResult(null)
    const res = await sendPoll(sessionId, {
      phone,
      name: pollQuestion,
      options: validOptions,
    })
    setLoading(false)
    if (res.success) {
      setResult({
        success: true,
        message: `Poll sent! ID: ${res.data?.messageId}`,
      })
      clearForm()
    } else {
      setResult({ success: false, message: res.error || "Failed to send" })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Message</CardTitle>
        <CardDescription>
          Compose and send messages to WhatsApp contacts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            placeholder="5511999999999"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            International format without + (e.g., 5511999999999)
          </p>
        </div>

        {result && (
          <div
            className={`p-3 rounded-md text-sm ${
              result.success
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {result.message}
          </div>
        )}

        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="text">
              <Send className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="media">
              <Image className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="location">
              <MapPin className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="contact">
              <Contact className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="poll">
              <BarChart3 className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="text">Message</Label>
              <Textarea
                id="text"
                placeholder="Type your message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
              />
            </div>
            <Button
              onClick={handleSendText}
              disabled={loading || !phone || !text}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Text
            </Button>
          </TabsContent>

          <TabsContent value="media" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">File</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="caption">Caption (optional)</Label>
              <Input
                id="caption"
                placeholder="Image/video caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => handleSendMedia("image")}
                disabled={loading || !phone || !file}
                variant="outline"
              >
                <Image className="h-4 w-4 mr-2" /> Image
              </Button>
              <Button
                onClick={() => handleSendMedia("video")}
                disabled={loading || !phone || !file}
                variant="outline"
              >
                <FileVideo className="h-4 w-4 mr-2" /> Video
              </Button>
              <Button
                onClick={() => handleSendMedia("audio")}
                disabled={loading || !phone || !file}
                variant="outline"
              >
                <FileAudio className="h-4 w-4 mr-2" /> Audio
              </Button>
              <Button
                onClick={() => handleSendMedia("document")}
                disabled={loading || !phone || !file}
                variant="outline"
              >
                <FileText className="h-4 w-4 mr-2" /> Document
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="location" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lat">Latitude</Label>
                <Input
                  id="lat"
                  placeholder="-23.5505"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lng">Longitude</Label>
                <Input
                  id="lng"
                  placeholder="-46.6333"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="locName">Location Name (optional)</Label>
              <Input
                id="locName"
                placeholder="Office"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address (optional)</Label>
              <Input
                id="address"
                placeholder="123 Main St"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <Button
              onClick={handleSendLocation}
              disabled={loading || !phone || !latitude || !longitude}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <MapPin className="h-4 w-4 mr-2" />
              )}
              Send Location
            </Button>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cName">Contact Name</Label>
              <Input
                id="cName"
                placeholder="John Doe"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cPhone">Contact Phone</Label>
              <Input
                id="cPhone"
                placeholder="5511888888888"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
            <Button
              onClick={handleSendContact}
              disabled={loading || !phone || !contactName || !contactPhone}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Contact className="h-4 w-4 mr-2" />
              )}
              Send Contact
            </Button>
          </TabsContent>

          <TabsContent value="poll" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <Input
                id="question"
                placeholder="What's your favorite color?"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Options</Label>
              {pollOptions.map((opt, i) => (
                <Input
                  key={i}
                  placeholder={`Option ${i + 1}`}
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...pollOptions]
                    newOpts[i] = e.target.value
                    setPollOptions(newOpts)
                  }}
                />
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPollOptions([...pollOptions, ""])}
              >
                + Add Option
              </Button>
            </div>
            <Button
              onClick={handleSendPoll}
              disabled={
                loading ||
                !phone ||
                !pollQuestion ||
                pollOptions.filter((o) => o).length < 2
              }
              className="w-full"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <BarChart3 className="h-4 w-4 mr-2" />
              )}
              Send Poll
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
