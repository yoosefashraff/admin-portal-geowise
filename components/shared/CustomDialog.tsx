import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CustomDialogProps {
  showDialog: boolean;
  setShowDialog: React.Dispatch<React.SetStateAction<boolean>>;
  title: string;
  description: string;
  handleSubmit: () => void
}
export default function CustomDialog({showDialog, setShowDialog, handleSubmit, title, description}: CustomDialogProps) {
  return (
    <Dialog open={showDialog} onOpenChange={()=>setShowDialog(false)}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
                {description}
            </DialogDescription>
        </DialogHeader>
        <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog ? setShowDialog(false) : null} className="cursor-pointer">Cancel</Button>
            <Button variant="destructive" className="cursor-pointer" onClick={() => {
                setShowDialog(false);
                handleSubmit();
            }}>Yes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}