'use client'

import {
  GalleryVerticalEnd,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Users,
  MessageCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function QueuesPage() {
  // Mock data for queues
  const queues = [
    {
      id: '1',
      name: 'Support',
      description: 'General customer support',
      users: 3,
      tickets: 15,
      status: 'active',
    },
    {
      id: '2',
      name: 'Sales',
      description: 'Sales inquiries and quotes',
      users: 2,
      tickets: 8,
      status: 'active',
    },
    {
      id: '3',
      name: 'Billing',
      description: 'Billing and payment issues',
      users: 2,
      tickets: 12,
      status: 'inactive',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Queues</h2>
          <p className="text-muted-foreground">
            Manage support queues and ticket distribution
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Queue
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {queues.map((queue) => (
          <Card key={queue.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <GalleryVerticalEnd className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{queue.name}</CardTitle>
                    <CardDescription>{queue.description}</CardDescription>
                  </div>
                </div>
                <Badge variant={queue.status === 'active' ? 'success' : 'secondary'}>
                  {queue.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{queue.users} users</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  <span>{queue.tickets} tickets</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Queues</CardTitle>
          <CardDescription>
            Complete list of all support queues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Tickets</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queues.map((queue) => (
                <TableRow key={queue.id}>
                  <TableCell className="font-medium">
                    {queue.name}
                  </TableCell>
                  <TableCell>{queue.description}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{queue.users}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{queue.tickets}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={queue.status === 'active' ? 'success' : 'secondary'}>
                      {queue.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
