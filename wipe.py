import sqlite3

conn = sqlite3.connect('dev.db')
cursor = conn.cursor()

# Wipe notifications
cursor.execute('DELETE FROM Notification')
print("Deleted Notifications:", cursor.rowcount)

# Wipe queue bookings
cursor.execute('DELETE FROM QueueBooking')
print("Deleted QueueBookings:", cursor.rowcount)

# Wipe users with role member
cursor.execute("DELETE FROM User WHERE role='member'")
print("Deleted Users (members):", cursor.rowcount)

conn.commit()
conn.close()
print("Wiped all members, bookings, and notifications.")
