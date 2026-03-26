import sys
import traceback
from seed_ugms import seed

try:
    seed()
except Exception as e:
    with open("seed_err2.txt", "w", encoding="utf-8") as f:
        traceback.print_exc(file=f)
    print("Error saved to seed_err2.txt")
