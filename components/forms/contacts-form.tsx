'use client'

import { useForm } from "react-hook-form"
import InputField from "./fields/input-field"
import { Button } from "../ui/button"
import { useToast } from "../toast-context"
import CustomToast from "../custom-toast"
import { useState } from "react"

const AddContactForm = () => {
  const { showToast } = useToast()
  const [createdContacts, setCreatedContacts] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    defaultValues: {
        full_name: "",
        mobile: "",
        alt_mobile: "",
        email: "",
        gender: "",
    },
     mode: 'onBlur'
  },)

  const onSubmit = async (data: ContactFormData ) => {
    try {
        // const {data: createdContacts} = await CreateContacts([data])

      showToast({
        title: "Form submitted!",
        description: `Thank you, we'll contact you`,
        variant: "success",
        actionLabel: "Undo",
        onAction: () => {
          console.log("Form submission undone")
        },
      })       
    } catch (error) {
        console.error(error)
    }
  }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField 
                    name="fullName" 
                    label="Full Name" 
                    placeholder="Full Name" 
                    register={register}
                    error={errors.full_name}
                    validation={{required: 'Full name is required', minLength: 2}}              
                />
                <InputField 
                    name="email" 
                    label="Email" 
                    placeholder="Email Address" 
                    register={register}    
                    error={errors.email}
                    validation={{required: 'Email is required', minLength: 2, pattern: /^\w+@\w+\.\w+$/}}                                 
                />                
            </div>
            <div className="flex ml-auto">
                <Button type="submit" disabled={isSubmitting} className="submit-btn w-full mt-5">{isSubmitting ? "Adding New Contact" : "Create Contact"}</Button>
            </div>
        </form>
    )
}

export default AddContactForm