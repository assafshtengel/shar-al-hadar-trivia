
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Bulb } from "lucide-react"

export const ImprovementDialog = () => {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [feedback, setFeedback] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Here you would typically send this to your backend
      // For now, we'll just show a success message
      console.log("Feedback submitted:", { name, phone, feedback })
      
      toast({
        title: "תודה על המשוב!",
        description: "קיבלנו את ההצעה שלך ונבחן אותה בקרוב",
      })

      // Reset form
      setName("")
      setPhone("")
      setFeedback("")
    } catch (error) {
      toast({
        title: "שגיאה בשליחת המשוב",
        description: "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" className="flex items-center gap-2">
          <Bulb className="h-4 w-4" />
          רעיונות לשיפור
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary mb-4">
            יש לך רעיון מעולה? בוא נחשוב יחד!
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">שם</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="השם שלך"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">טלפון</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="מספר הטלפון שלך"
              type="tel"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="feedback">הרעיון שלך לשיפור</Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="ספר לנו על הרעיון שלך..."
              className="h-32"
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "שולח..." : "שלח רעיון"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
