'use client';

import { Layers3, Home as HomeIcon, Layers } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function SelectionPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center">
        <Card className="shadow-2xl">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Layers3 className="h-8 w-8" />
            </div>
            <CardTitle className="text-3xl font-bold text-primary">Welcome</CardTitle>
            <CardDescription>Please select your workspace to continue.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button asChild size="lg">
              <Link href="/login/mentorme" className="flex items-center gap-2">
                <Layers3 className="h-5 w-5" />
                <span>MentorMe Up</span>
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/login/homeworkers" className="flex items-center gap-2">
                <HomeIcon className="h-5 w-5" />
                <span>Home Workers</span>
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login/neo" className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                <span>Neo Up</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
