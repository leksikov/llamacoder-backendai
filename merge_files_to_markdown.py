import os
import glob

def merge_files_to_markdown(directory_path, output_file, exclude_folders=None):
    if exclude_folders is None:
        exclude_folders = []
    
    # List to store file contents
    content_sections = []
    
    # Function to read file content
    def read_file(filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as file:
                return file.read()
        except Exception as e:
            return f"Error reading file {filepath}: {str(e)}"
    
    # Walk through directory
    for root, dirs, files in os.walk(directory_path):
        # Skip excluded folders
        if any(excluded in root for excluded in exclude_folders):
            continue
        
        # Find TypeScript and component files
        ts_files = glob.glob(os.path.join(root, "*.ts"))
        tsx_files = glob.glob(os.path.join(root, "*.tsx"))
        
        # Process all matching files
        for file_path in ts_files + tsx_files:
            relative_path = os.path.relpath(file_path, directory_path)
            content = read_file(file_path)
            
            # Add file content to sections
            section = f"## {relative_path}\n\n```typescript\n{content}\n```\n\n"
            content_sections.append(section)
    
    # Write combined content to markdown file
    with open(output_file, 'w', encoding='utf-8') as outfile:
        outfile.write("# Project Documentation\n\n")
        outfile.write("".join(content_sections))

if __name__ == "__main__":
    directory = input("Enter directory path: ")
    output = input("Enter output markdown file path: ")
    exclude_folders = input("Enter folders to exclude (comma-separated): ").split(',')
    merge_files_to_markdown(directory, output, exclude_folders)
