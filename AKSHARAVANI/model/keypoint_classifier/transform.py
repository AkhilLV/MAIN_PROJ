import csv

# File names
input_file = "keypoint.csv"  # Replace with your actual file
output_file = "output.csv"

with open(input_file, "r", encoding="utf-8") as infile, open(output_file, "w", encoding="utf-8", newline="") as outfile:
    reader = csv.reader(infile)
    writer = csv.writer(outfile)

    for row in reader:
        if row:  # Ensure the row is not empty
            row[0] = str(float(row[0]) - 3)  # Convert to float, decrement, and convert back to string
        writer.writerow(row)

print("Processing complete. Check output.csv")
