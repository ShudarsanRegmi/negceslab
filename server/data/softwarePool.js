const softwarePool = [
  // Programming & Development Tools
  {
    name: "Python",
    version: "3.11",
    category: "Development",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",
    keywords: ["python", "py", "programming", "scripting"]
  },
  {
    name: "Node.js",
    version: "18.x",
    category: "Development",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg",
    keywords: ["node", "nodejs", "javascript", "js", "npm"]
  },
  {
    name: "Java",
    version: "17",
    category: "Development",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg",
    keywords: ["java", "jdk", "programming"]
  },
  {
    name: "C++",
    version: "20",
    category: "Development",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg",
    keywords: ["cpp", "c++", "programming"]
  },
  {
    name: "Git",
    version: "2.x",
    category: "Development",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg",
    keywords: ["git", "version control", "vcs"]
  },
  {
    name: "Visual Studio Code",
    version: "1.x",
    category: "Development",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg",
    keywords: ["vscode", "code", "editor", "ide"]
  },
  {
    name: "IntelliJ IDEA",
    version: "2023.x",
    category: "Development",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/intellij/intellij-original.svg",
    keywords: ["intellij", "idea", "java", "ide"]
  },
  {
    name: "PyCharm",
    version: "2023.x",
    category: "Development",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pycharm/pycharm-original.svg",
    keywords: ["pycharm", "python", "ide"]
  },

  // Scientific & Data Analysis Tools
  {
    name: "Anaconda",
    version: "2023.x",
    category: "Analysis",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/anaconda/anaconda-original.svg",
    keywords: ["anaconda", "conda", "python", "data science", "scientific"]
  },
  {
    name: "MATLAB",
    version: "R2023b",
    category: "Analysis",
    icon: "https://www.mathworks.com/favicon.ico",
    keywords: ["matlab", "matrix", "scientific", "numerical"]
  },
  {
    name: "R",
    version: "4.3.x",
    category: "Analysis",
    icon: "https://www.r-project.org/favicon.ico",
    keywords: ["r", "statistics", "data analysis", "scientific"]
  },
  {
    name: "Jupyter Notebook",
    version: "6.x",
    category: "Analysis",
    icon: "https://jupyter.org/favicon.ico",
    keywords: ["jupyter", "notebook", "python", "data science"]
  },
  {
    name: "RStudio",
    version: "2023.x",
    category: "Analysis",
    icon: "https://www.rstudio.com/favicon.ico",
    keywords: ["rstudio", "r", "statistics", "ide"]
  },
  {
    name: "SPSS",
    version: "28",
    category: "Analysis",
    icon: "https://www.ibm.com/favicon.ico",
    keywords: ["spss", "statistics", "social sciences"]
  },
  {
    name: "Stata",
    version: "18",
    category: "Analysis",
    icon: "https://www.stata.com/favicon.ico",
    keywords: ["stata", "statistics", "econometrics"]
  },
  {
    name: "SAS",
    version: "9.4",
    category: "Analysis",
    icon: "https://www.sas.com/favicon.ico",
    keywords: ["sas", "statistics", "analytics"]
  },
  {
    name: "Tableau",
    version: "2023.x",
    category: "Analysis",
    icon: "https://www.tableau.com/favicon.ico",
    keywords: ["tableau", "visualization", "bi", "dashboard"]
  },
  {
    name: "Power BI",
    version: "2023.x",
    category: "Analysis",
    icon: "https://powerbi.microsoft.com/favicon.ico",
    keywords: ["powerbi", "bi", "microsoft", "dashboard"]
  },

  // Graphics & Design Tools
  {
    name: "Adobe Photoshop",
    version: "2024",
    category: "Design",
    icon: "https://www.adobe.com/favicon.ico",
    keywords: ["photoshop", "adobe", "image editing", "graphics"]
  },
  {
    name: "Adobe Illustrator",
    version: "2024",
    category: "Design",
    icon: "https://www.adobe.com/favicon.ico",
    keywords: ["illustrator", "adobe", "vector", "graphics"]
  },
  {
    name: "Adobe InDesign",
    version: "2024",
    category: "Design",
    icon: "https://www.adobe.com/favicon.ico",
    keywords: ["indesign", "adobe", "layout", "publishing"]
  },
  {
    name: "GIMP",
    version: "2.10",
    category: "Design",
    icon: "https://www.gimp.org/favicon.ico",
    keywords: ["gimp", "image editing", "free", "open source"]
  },
  {
    name: "Inkscape",
    version: "1.3",
    category: "Design",
    icon: "https://inkscape.org/favicon.ico",
    keywords: ["inkscape", "vector", "svg", "free"]
  },
  {
    name: "Blender",
    version: "4.0",
    category: "Design",
    icon: "https://www.blender.org/favicon.ico",
    keywords: ["blender", "3d", "modeling", "animation"]
  },
  {
    name: "AutoCAD",
    version: "2024",
    category: "Design",
    icon: "https://www.autodesk.com/favicon.ico",
    keywords: ["autocad", "cad", "drafting", "engineering"]
  },
  {
    name: "SolidWorks",
    version: "2024",
    category: "Design",
    icon: "https://www.solidworks.com/favicon.ico",
    keywords: ["solidworks", "cad", "3d modeling", "engineering"]
  },
  {
    name: "Fusion 360",
    version: "2024",
    category: "Design",
    icon: "https://www.autodesk.com/favicon.ico",
    keywords: ["fusion360", "cad", "3d modeling", "autodesk"]
  },

  // Office & Productivity Tools
  {
    name: "Microsoft Office",
    version: "2021",
    category: "Office",
    icon: "https://www.microsoft.com/favicon.ico",
    keywords: ["office", "microsoft", "word", "excel", "powerpoint"]
  },
  {
    name: "Microsoft Word",
    version: "2021",
    category: "Office",
    icon: "https://www.microsoft.com/favicon.ico",
    keywords: ["word", "microsoft", "document", "writing"]
  },
  {
    name: "Microsoft Excel",
    version: "2021",
    category: "Office",
    icon: "https://www.microsoft.com/favicon.ico",
    keywords: ["excel", "microsoft", "spreadsheet", "data"]
  },
  {
    name: "Microsoft PowerPoint",
    version: "2021",
    category: "Office",
    icon: "https://www.microsoft.com/favicon.ico",
    keywords: ["powerpoint", "microsoft", "presentation", "slides"]
  },
  {
    name: "LibreOffice",
    version: "7.6",
    category: "Office",
    icon: "https://www.libreoffice.org/favicon.ico",
    keywords: ["libreoffice", "openoffice", "free", "office"]
  },
  {
    name: "Google Workspace",
    version: "2023",
    category: "Office",
    icon: "https://workspace.google.com/favicon.ico",
    keywords: ["google", "workspace", "docs", "sheets", "slides"]
  },

  // Web Development Tools
  {
    name: "Visual Studio",
    version: "2022",
    category: "Development",
    icon: "https://visualstudio.microsoft.com/favicon.ico",
    keywords: ["visualstudio", "vs", "microsoft", "ide"]
  },
  {
    name: "Eclipse",
    version: "2023-12",
    category: "Development",
    icon: "https://www.eclipse.org/favicon.ico",
    keywords: ["eclipse", "ide", "java", "development"]
  },
  {
    name: "NetBeans",
    version: "21",
    category: "Development",
    icon: "https://netbeans.apache.org/favicon.ico",
    keywords: ["netbeans", "ide", "java", "development"]
  },
  {
    name: "Sublime Text",
    version: "4",
    category: "Development",
    icon: "https://www.sublimetext.com/favicon.ico",
    keywords: ["sublime", "text", "editor", "code"]
  },
  {
    name: "Atom",
    version: "1.60",
    category: "Development",
    icon: "https://atom.io/favicon.ico",
    keywords: ["atom", "editor", "github", "code"]
  },

  // Database Tools
  {
    name: "MySQL",
    version: "8.0",
    category: "Development",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg",
    keywords: ["mysql", "database", "sql", "oracle"]
  },
  {
    name: "PostgreSQL",
    version: "15",
    category: "Development",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg",
    keywords: ["postgresql", "postgres", "database", "sql"]
  },
  {
    name: "MongoDB",
    version: "7.0",
    category: "Development",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg",
    keywords: ["mongodb", "database", "nosql", "document"]
  },
  {
    name: "SQLite",
    version: "3.44",
    category: "Development",
    icon: "https://www.sqlite.org/favicon.ico",
    keywords: ["sqlite", "database", "lightweight", "embedded"]
  },

  // Machine Learning & AI Tools
  {
    name: "TensorFlow",
    version: "2.15",
    category: "Analysis",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tensorflow/tensorflow-original.svg",
    keywords: ["tensorflow", "ml", "ai", "deep learning", "google"]
  },
  {
    name: "PyTorch",
    version: "2.1",
    category: "Analysis",
    icon: "https://pytorch.org/favicon.ico",
    keywords: ["pytorch", "ml", "ai", "deep learning", "facebook"]
  },
  {
    name: "Scikit-learn",
    version: "1.3",
    category: "Analysis",
    icon: "https://scikit-learn.org/favicon.ico",
    keywords: ["scikit", "sklearn", "ml", "machine learning", "python"]
  },
  {
    name: "Keras",
    version: "2.15",
    category: "Analysis",
    icon: "https://keras.io/favicon.ico",
    keywords: ["keras", "ml", "ai", "deep learning", "neural networks"]
  },

  // Cloud & DevOps Tools
  {
    name: "Docker",
    version: "24.x",
    category: "Development",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg",
    keywords: ["docker", "container", "devops", "deployment"]
  },
  {
    name: "Kubernetes",
    version: "1.28",
    category: "Development",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg",
    keywords: ["kubernetes", "k8s", "container", "orchestration"]
  },
  {
    name: "Jenkins",
    version: "2.414",
    category: "Development",
    icon: "https://www.jenkins.io/favicon.ico",
    keywords: ["jenkins", "ci/cd", "automation", "devops"]
  },
  {
    name: "Ansible",
    version: "8.x",
    category: "Development",
    icon: "https://www.ansible.com/favicon.ico",
    keywords: ["ansible", "automation", "devops", "configuration"]
  },

  // Other Tools
  {
    name: "Wireshark",
    version: "4.0",
    category: "Other",
    icon: "https://www.wireshark.org/favicon.ico",
    keywords: ["wireshark", "network", "protocol", "analysis"]
  },
  {
    name: "VirtualBox",
    version: "7.0",
    category: "Other",
    icon: "https://www.virtualbox.org/favicon.ico",
    keywords: ["virtualbox", "virtualization", "vm", "oracle"]
  },
  {
    name: "VMware",
    version: "17",
    category: "Other",
    icon: "https://www.vmware.com/favicon.ico",
    keywords: ["vmware", "virtualization", "vm", "workstation"]
  },
  {
    name: "PuTTY",
    version: "0.79",
    category: "Other",
    icon: "https://www.putty.org/favicon.ico",
    keywords: ["putty", "ssh", "terminal", "remote"]
  },
  {
    name: "WinSCP",
    version: "6.1",
    category: "Other",
    icon: "https://winscp.net/favicon.ico",
    keywords: ["winscp", "ftp", "sftp", "file transfer"]
  }
];

// OS Icons for system details
const osIcons = {
  'Windows': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/windows8/windows8-original.svg',
  'Linux': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg',
  'macOS': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apple/apple-original.svg',
  'Dual Boot': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/windows8/windows8-original.svg', // Will be handled specially in frontend
  'WSL': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/windows8/windows8-original.svg', // Will be handled specially in frontend
  'VM on Linux': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg',
  'Other': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ubuntu/ubuntu-plain.svg'
};

module.exports = { softwarePool, osIcons }; 