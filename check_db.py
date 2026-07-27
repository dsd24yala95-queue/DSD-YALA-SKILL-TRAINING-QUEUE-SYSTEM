import sqlite3
try:
    db1 = sqlite3.connect('dev.db')
    print('dev.db tables:', db1.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall())
except Exception as e:
    print('dev.db error:', e)

try:
    db2 = sqlite3.connect('prisma/dev.db')
    print('prisma/dev.db tables:', db2.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall())
except Exception as e:
    print('prisma/dev.db error:', e)
