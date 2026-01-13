"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Plus,
  MapPin,
  Clock,
  Trash2,
  Edit2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

type EventType = "practice" | "game" | "meeting" | "other";

interface TeamScheduleCardProps {
  teamId: Id<"teams">;
  canEdit: boolean;
}

export function TeamScheduleCard({ teamId, canEdit }: TeamScheduleCardProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [eventToDelete, setEventToDelete] = useState<any>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState<EventType>("practice");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const events = useQuery(api.scheduleEvents.getUpcoming, { teamId, limit: 10 });
  const createEvent = useMutation(api.scheduleEvents.create);
  const updateEvent = useMutation(api.scheduleEvents.update);
  const deleteEvent = useMutation(api.scheduleEvents.remove);

  const resetForm = () => {
    setTitle("");
    setEventType("practice");
    setDate("");
    setTime("");
    setLocation("");
    setNotes("");
    setEditingEvent(null);
  };

  const openAddDialog = () => {
    resetForm();
    setShowAddDialog(true);
  };

  const openEditDialog = (event: any) => {
    setEditingEvent(event);
    setTitle(event.title);
    setEventType(event.type);
    const eventDate = new Date(event.startTime);
    setDate(eventDate.toISOString().split("T")[0]);
    setTime(
      eventDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    );
    setLocation(event.location || "");
    setNotes(event.notes || "");
    setShowAddDialog(true);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !date || !time) {
      toast.error("Please fill in title, date, and time");
      return;
    }

    setIsSubmitting(true);
    try {
      const startTime = new Date(`${date}T${time}`).getTime();

      if (editingEvent) {
        await updateEvent({
          eventId: editingEvent._id,
          title: title.trim(),
          type: eventType,
          startTime,
          location: location.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        toast.success("Event updated");
      } else {
        await createEvent({
          teamId,
          title: title.trim(),
          type: eventType,
          startTime,
          location: location.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        toast.success("Event created");
      }

      setShowAddDialog(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to save event");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!eventToDelete) return;

    try {
      await deleteEvent({ eventId: eventToDelete._id });
      toast.success("Event deleted");
      setShowDeleteDialog(false);
      setEventToDelete(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete event");
    }
  };

  const getEventTypeBadge = (type: EventType) => {
    const styles: Record<EventType, string> = {
      practice: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      game: "bg-green-500/10 text-green-500 border-green-500/20",
      meeting: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      other: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    };
    return (
      <Badge className={styles[type]}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const formatEventDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) return "Today";
    if (isTomorrow) return "Tomorrow";

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatEventTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (events === undefined) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Team Schedule
              </CardTitle>
              <CardDescription>
                {events.length} upcoming event{events.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            {canEdit && (
              <Button onClick={openAddDialog} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Event
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No upcoming events</p>
              {canEdit && (
                <p className="text-sm mt-1">
                  Click &quot;Add Event&quot; to schedule one
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event._id}
                  className="p-4 rounded-lg bg-muted/30 border"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{event.title}</h4>
                        {getEventTypeBadge(event.type)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatEventDate(event.startTime)} at{" "}
                          {formatEventTime(event.startTime)}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {event.location}
                          </span>
                        )}
                      </div>
                      {event.notes && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {event.notes}
                        </p>
                      )}
                    </div>
                    {canEdit && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(event)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEventToDelete(event);
                            setShowDeleteDialog(true);
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Event Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? "Edit Event" : "Add New Event"}
            </DialogTitle>
            <DialogDescription>
              {editingEvent
                ? "Update the event details"
                : "Schedule a practice, game, or meeting"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g., Practice at Main Field"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Event Type</Label>
              <Select
                value={eventType}
                onValueChange={(v) => setEventType(v as EventType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="practice">Practice</SelectItem>
                  <SelectItem value="game">Game</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location (optional)</Label>
              <Input
                id="location"
                placeholder="e.g., Main Field, Building A"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {editingEvent ? "Update" : "Create"} Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{eventToDelete?.title}&quot;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
