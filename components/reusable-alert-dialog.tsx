"use client"

import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';

interface Props {
    trigger: React.ReactNode
    title: string
    description: string
    cancelText: string
    submit: () => void
    submitClasses?: string
    submitText: string
}

const ReusableAlertDialog = ({trigger,title,description,cancelText, submit, submitClasses, submitText}: Props) => (
    <AlertDialog>
        <AlertDialogTrigger asChild>
            {trigger}
        </AlertDialogTrigger>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{title}</AlertDialogTitle>
                <AlertDialogDescription>
                    {description}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel className='cursor-pointer'>{cancelText}</AlertDialogCancel>
            <AlertDialogAction onClick={submit} className={cn("cursor-pointer",submitClasses)} >{submitText}</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
  )

export default ReusableAlertDialog