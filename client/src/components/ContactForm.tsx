import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { api } from "@shared/routes";
import { insertContactMessageSchema } from "@shared/schema";
import type { ContactMessageInput } from "@shared/routes";
import { useContact } from "@/hooks/use-contact";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ContactForm() {
  const { mutate: submitContact, isPending } = useContact();

  const form = useForm<ContactMessageInput>({
    resolver: zodResolver(insertContactMessageSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      service: "",
      message: "",
    },
  });

  function onSubmit(data: ContactMessageInput) {
    submitContact(data, {
      onSuccess: () => {
        form.reset();
      },
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs uppercase tracking-widest text-muted-foreground">Full Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Jane Doe" 
                    {...field} 
                    className="bg-transparent border-t-0 border-x-0 border-b border-white/20 rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 py-6 text-lg transition-colors placeholder:text-muted-foreground/30"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs uppercase tracking-widest text-muted-foreground">Email Address</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="jane@example.com" 
                    type="email"
                    {...field} 
                    className="bg-transparent border-t-0 border-x-0 border-b border-white/20 rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 py-6 text-lg transition-colors placeholder:text-muted-foreground/30"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs uppercase tracking-widest text-muted-foreground">Phone Number (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="+1 (555) 000-0000" 
                    {...field} 
                    value={field.value || ""}
                    className="bg-transparent border-t-0 border-x-0 border-b border-white/20 rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 py-6 text-lg transition-colors placeholder:text-muted-foreground/30"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="service"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs uppercase tracking-widest text-muted-foreground">Service Interested In</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-transparent border-t-0 border-x-0 border-b border-white/20 rounded-none focus:ring-0 focus:border-primary px-0 py-6 text-lg transition-colors">
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-card border-white/10 text-foreground">
                    <SelectItem value="Wedding Photography">Wedding Photography</SelectItem>
                    <SelectItem value="Cinematography">Cinematography</SelectItem>
                    <SelectItem value="Pre-Wedding Shoot">Pre-Wedding Shoot</SelectItem>
                    <SelectItem value="Portrait & Editorial">Portrait & Editorial</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs uppercase tracking-widest text-muted-foreground">Your Message</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Tell us about your special day..."
                  {...field} 
                  className="bg-transparent border-t-0 border-x-0 border-b border-white/20 rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 py-6 text-lg transition-colors placeholder:text-muted-foreground/30 min-h-[150px] resize-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={isPending}
          className="w-full md:w-auto px-12 py-7 text-sm uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Sending...
            </span>
          ) : "Send Inquiry"}
        </Button>
      </form>
    </Form>
  );
}
