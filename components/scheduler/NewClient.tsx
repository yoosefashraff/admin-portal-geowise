'use client';

import { ArrowLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Separator } from "@radix-ui/react-select";
import PhoneInput from "react-phone-number-input";
import { useState } from "react";
import { Button } from "../ui/button";
import { Customer } from "@/lib/types/scheduler.types";
import {z} from 'zod';
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, Form } from "@/components/ui/form";
import { allCallingCountries, getCallingCode } from "@/lib/utils";

interface NewClientProps {
	setIsAddNewClient: React.Dispatch<React.SetStateAction<boolean>>;
	handleBooking: (newCustomer: Customer | null) => Promise<void>;
}

const emailRegex =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formSchema = z.object({
	Name: z.string().min(1, 'Name is required'),
	Contact: z.string().min(1, 'Phone number is required'),
	Email: z.string().min(1, 'Email is required').regex(emailRegex, "Invalid email format"),
	CountryCode: z.string().min(1, 'Country code is required')
})

export default function NewClient({ setIsAddNewClient, handleBooking }: NewClientProps) {

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			Name: "",
			Contact: "",
			Email: "",
			CountryCode: "US"
		},
	})

	const onSubmit = (values: z.infer<typeof formSchema>) => {
		const newCustomer = {
			Name: values.Name,
			Contact: values.Contact,
			Email: values.Email,
			CountryCode: getCallingCode(values.CountryCode),
		}
		handleBooking(newCustomer);
	}

	return (
		<Card className="border-0 shadow-[0px_2px_24px_rgba(16,24,40,0.06) p-6">
			<CardContent className="px-0">
				<div className="flex items-center gap-x-3 mb-4">
					<span className="font-medium text-sm text-gray-500">Assign client</span>
					<ChevronRight className="h-4 w-4 text-gray-300" />
					<span className="font-medium text-sm text-gray-700">New Client</span>
				</div>
				<h3 className="text-base font-medium sm:text-lg mb-4">New Client</h3>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<FormField
              control={form.control}
              name="Name"
              render={({ field }) => (
                <FormItem className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="flex items-center">
                  	<FormLabel className="font-medium">Full Name</FormLabel>
									</div>
									<div className="flex flex-col gap-2">
										<FormControl className="flex flex-col gap-2">
											<Input className="h-11 h-11 border-gray-300" placeholder="Full Name" {...field} />
										</FormControl>
										<FormMessage />
									</div>
                  
                </FormItem>
              )}
            />
						<Separator className="my-4 bg-gray-200" />

						<FormField
							control={form.control}
							name="Contact"
							render={({ field }) => (
								<FormItem className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="flex items-center">
										<FormLabel className="font-medium">Phone number</FormLabel>
									</div>
									<div className="flex flex-col gap-2">
										<FormControl>
											<div className="flex items-center w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700 focus-within:ring-2 focus-within:ring-blue-500">
												<FormField
													control={form.control}
													name="CountryCode"
													render={({ field: countryField }) => (
														<select
															value={countryField.value}
															onChange={countryField.onChange}
															className="bg-transparent outline-none cursor-pointer font-medium text-gray-700 pr-2 border-r border-gray-300"
														>
															{allCallingCountries().map((country, index) => (
																<option key={index} value={country}>
																	{country}
																</option>
															))}
														</select>
													)}
												/>
												
												<span className="text-gray-500 px-2">
													{getCallingCode(form.watch('CountryCode'))}
												</span>
												
												<input
													type="tel"
													value={field.value}
													onChange={field.onChange}
													placeholder="123 456 7890"
													className="flex-1 bg-transparent outline-none text-gray-700"
												/>
											</div>
										</FormControl>
										<FormMessage />
									</div>
								</FormItem>
							)}
						/>

						<Separator className="my-4 bg-gray-200" />
						<FormField
              control={form.control}
              name="Email"
              render={({ field }) => (
                <FormItem className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="flex items-center">
                  	<FormLabel className="font-medium">Email</FormLabel>
									</div>
									<div className="flex flex-col gap-2">
										<FormControl className="flex flex-col gap-2">
											<Input className="h-11 h-11 border-gray-300" placeholder="user@contact.com" {...field} />
										</FormControl>
										<FormMessage />
									</div>
                  
                </FormItem>
              )}
            />

						{/* Buttons */}
						<div className="flex justify-end gap-x-3 pt-8">
							<Button variant="outline" onClick={() => setIsAddNewClient(false)}>
								<ArrowLeft className="h-6 w-6"></ArrowLeft>
								Back
							</Button>
							<Button className="cursor-pointer" type="submit">Save</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	)
}