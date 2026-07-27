export interface MasterCourse {
    id: string;
    courseName: string;
    durationDays: number;
    maxSeats: number;
    currentQueue: number;
    Date: string;
    LocationName?: string;
    LocationGPS?: string;
    status: "active" | "inactive";
}

export interface MasterBranch {
    id: string;
    branchName: string;
    levels: string;
    maxQueue: number;
    currentQueue: number;
    LocationName?: string;
    LocationGPS?: string;
    status: "active" | "inactive";
}

export interface QueueItem {
    id?: string;
    userId: string;
    type: "test" | "training";
    itemId: string;
    itemName: string;
    status: "pending" | "confirmed" | "cancelled" | "checked_in" | "waiting_live" | "testing" | "passed" | "failed";
    appointedDate?: string;
    queueNumber?: number;
    createdAt: any;
}

export async function getActiveCourses(): Promise<MasterCourse[]> {
    try {
        const res = await fetch("/api/master/courses");
        if (!res.ok) throw new Error("Failed to fetch courses");
        const data = await res.json();
        return data.filter((c: any) => c.status === "active");
    } catch (error) {
        console.error("Error fetching courses:", error);
        return [];
    }
}

export async function getActiveBranches(): Promise<MasterBranch[]> {
    try {
        const res = await fetch("/api/master/branches");
        if (!res.ok) throw new Error("Failed to fetch branches");
        const data = await res.json();
        return data.filter((b: any) => b.status === "active");
    } catch (error) {
        console.error("Error fetching branches:", error);
        return [];
    }
}

export async function createQueueBooking(userId: string, type: "test" | "training", itemId: string, itemName: string) {
    try {
        const res = await fetch("/api/bookings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId,
                bookingType: type,
                itemId,
                itemName
            })
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || "Failed to create booking");
        }
        
        // Also create a notification
        await fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId,
                title: "การจองคิวสำเร็จ",
                message: `คุณได้ทำการจองคิว ${itemName} เรียบร้อยแล้ว โปรดรอการยืนยันจากเจ้าหน้าที่`
            })
        });

        return true;
    } catch (error) {
        console.error("Error creating booking:", error);
        throw error;
    }
}

export async function getUserQueues(userId: string): Promise<QueueItem[]> {
    try {
        const res = await fetch(`/api/bookings?userId=${userId}`);
        if (!res.ok) throw new Error("Failed to fetch queues");
        return await res.json();
    } catch (error) {
        console.error("Error fetching queues:", error);
        return [];
    }
}