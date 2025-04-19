
import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

type Improvement = {
  id: string
  created_at: string
  name: string
  phone: string
  feedback: string
  status: 'pending' | 'in_review' | 'approved' | 'implemented' | 'rejected'
}

const statusTranslations = {
  pending: 'ממתין',
  in_review: 'בבדיקה',
  approved: 'אושר',
  implemented: 'יושם',
  rejected: 'נדחה'
}

export default function ImprovementsAdmin() {
  const [improvements, setImprovements] = useState<Improvement[]>([])
  const { toast } = useToast()

  useEffect(() => {
    fetchImprovements()
  }, [])

  const fetchImprovements = async () => {
    const { data, error } = await supabase
      .from('improvements')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      toast({
        title: "שגיאה בטעינת ההצעות",
        description: "אנא נסה לרענן את העמוד",
        variant: "destructive",
      })
      return
    }

    setImprovements(data || [])
  }

  const updateStatus = async (id: string, newStatus: Improvement['status']) => {
    const { error } = await supabase
      .from('improvements')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) {
      toast({
        title: "שגיאה בעדכון הסטטוס",
        description: "אנא נסה שוב",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "הסטטוס עודכן בהצלחה",
    })

    fetchImprovements()
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-right">ניהול הצעות לשיפור</h1>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">תאריך</TableHead>
              <TableHead className="text-right">שם</TableHead>
              <TableHead className="text-right">טלפון</TableHead>
              <TableHead className="text-right">הצעה</TableHead>
              <TableHead className="text-right">סטטוס</TableHead>
              <TableHead className="text-right">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {improvements.map((improvement) => (
              <TableRow key={improvement.id}>
                <TableCell>
                  {new Date(improvement.created_at).toLocaleDateString('he-IL')}
                </TableCell>
                <TableCell>{improvement.name}</TableCell>
                <TableCell>{improvement.phone}</TableCell>
                <TableCell className="max-w-md">{improvement.feedback}</TableCell>
                <TableCell>{statusTranslations[improvement.status]}</TableCell>
                <TableCell>
                  <select
                    value={improvement.status}
                    onChange={(e) => updateStatus(improvement.id, e.target.value as Improvement['status'])}
                    className="border rounded p-1"
                  >
                    {Object.entries(statusTranslations).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
