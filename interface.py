import tkinter as tk
from tkinter import filedialog, messagebox
from tkinter import ttk
import smtplib
from email.message import EmailMessage
import os
import pandas as pd
from time import sleep
from datetime import datetime
import threading
import re
import json
import pytz
import imaplib
import random


should_cancel = False

def start_sending():
    thread = threading.Thread(target=send_emails)
    thread.start()


def is_valid_email(email):
    return re.match(r"[^@]+@[^@]+\.[^@]+", email)

def send_emails():
    global should_cancel
    should_cancel = False  

    from_name = from_name_entry.get()
    from_email = from_email_entry.get()
    password = password_entry.get()
    to = to_entry.get()
    subject = subject_entry.get()
    body = body_text.get("1.0", tk.END)

    emails = [e.strip() for e in to.split(",") if is_valid_email(e.strip())]
    total = len(emails)

    if total == 0:
        messagebox.showerror("Erreur", "Aucun email valide trouvé.")
        return

    # UI: désactive Envoyer, active Annuler
    send_button.config(state="disabled")
    cancel_button.grid(row=11, column=1)  # Affiche le bouton annuler

    progress_bar["maximum"] = total
    progress_bar["value"] = 0

    for i, email in enumerate(emails, 1):
        if should_cancel:
            status_label.config(text="Envoi annulé.")
            break

        try:
            msg = EmailMessage()
            msg['Subject'] = subject
            msg['From'] = f'{from_name} <{from_email}>'
            msg['To'] = email
            msg.set_content(body, subtype='html')

            for file in files_to_attach:
                with open(file, "rb") as f:
                    file_data = f.read()
                    file_name = os.path.basename(file)
                    msg.add_attachment(file_data, maintype="application", subtype="octet-stream", filename=file_name)

            with smtplib.SMTP_SSL('smtp.ionos.fr', 465) as smtp:
                smtp.login(from_email, password)
                smtp.send_message(msg)

            try:
                # Obtenir l'heure actuelle avec fuseau horaire (ici UTC)
                utc_now = datetime.now(pytz.utc)

                with imaplib.IMAP4_SSL('imap.ionos.fr') as imap:
                    imap.login(from_email, password)

                    # Utilisation de l'heure avec fuseau horaire
                    imap.append('"Maillings"', '', imaplib.Time2Internaldate(utc_now), msg.as_bytes())
                    status_label.config(text="📥 Copié dans le dossier 'Messages envoyés'")
                    
                    imap.logout()

            except Exception as e:
                print(f"❌ Erreur IMAP (copie dans 'Maillings') : {e}")

            # Ajout de l'email envoyé dans le fichier
            with open("emails_envoyes.txt", "a") as f:
                f.write(f"{email}\n")

            # Mise à jour de la barre de progression
            progress_bar["value"] = i
            status_label.config(text=f"{i}/{total} envoyé : {email}")
            root.update_idletasks()

            sleep(random.uniform(1,5))
            

        except Exception as e:
            messagebox.showerror("Erreur", f"Échec d'envoi à {email}\n{e}")

    send_button.config(state="normal")
    cancel_button.grid_remove()  # Cache le bouton annuler

    if not should_cancel:
        messagebox.showinfo("Terminé", "Tous les emails ont été traités.")


def cancel_sending():
    global should_cancel
    should_cancel = True

def upload_file():
    files = filedialog.askopenfilenames()  # Autoriser la sélection multiple
    if files:
        for file in files:
            files_to_attach.append(file)
            files_listbox.insert(tk.END, file)

def save_fields():
    data = {
        "from_name": from_name_entry.get(),
        "from_email": from_email_entry.get(),
        "password": password_entry.get()
    }
    with open("config.json", "w") as f:
        json.dump(data, f)

# Fonction pour supprimer un fichier de la liste
def delete_file():
    try:
        selected_file = files_listbox.curselection()[0]
        files_to_attach.pop(selected_file)
        files_listbox.delete(selected_file)
    except IndexError:
        messagebox.showwarning("Avertissement", "Veuillez sélectionner un fichier à supprimer.")

# Fonction pour charger les emails depuis un fichier Excel
def load_emails_from_excel():
    file = filedialog.askopenfilename(filetypes=[("Excel Files", "*.xlsx;*.xls")])
    if file:
        try:
            df = pd.read_excel(file)
            emails = df['email'].dropna().tolist()
            to_entry.delete(0, tk.END)  # Efface l'ancienne adresse
            to_entry.insert(0, ', '.join(emails))  # Ajoute les emails dans le champ "To"
            messagebox.showinfo("Succès", f"Emails chargés depuis {file}")
        except Exception as e:
            messagebox.showerror("Erreur", f"Erreur lors du chargement du fichier Excel: {e}")

# Fonction pour prévisualiser l'email
def preview_email():
    preview_window = tk.Toplevel(root)
    preview_window.title("Aperçu de l'Email")

    preview_body = tk.Text(preview_window, height=15, width=60)
    preview_body.insert("1.0", f"Objet: {subject_entry.get()}\n\n{body_text.get('1.0', 'end-1c')}")
    preview_body.pack()

def on_close():
    if messagebox.askyesno("Sauvegarde", "Voulez-vous sauvegarder vos informations avant de quitter ?"):
        save_fields()
    root.destroy()


def load_fields():
    try:
        with open("config.json", "r") as f:
            data = json.load(f)
            from_name_entry.insert(0, data.get("from_name", ""))
            from_email_entry.insert(0, data.get("from_email", ""))
            password_entry.insert(0, data.get("password", ""))
    except FileNotFoundError:
        pass

# Création de la fenêtre principale
root = tk.Tk()
root.title("Envoi d'Email avec Pièces Jointes")

root.protocol("WM_DELETE_WINDOW", on_close)

# Initialisation de la liste des fichiers à envoyer
files_to_attach = []

# Création des champs d'entrée pour l'email
tk.Label(root, text="Email Destinataire:").grid(row=0, column=0, padx=10, pady=5)
to_entry = tk.Entry(root, width=50)
to_entry.grid(row=0, column=1, padx=10, pady=5)

tk.Label(root, text="Votre nom:").grid(row=1, column=0, padx=10, pady=5)
from_name_entry = tk.Entry(root, width=50)
from_name_entry.grid(row=1, column=1, padx=10, pady=5)

tk.Label(root, text="Votre Email:").grid(row=2, column=0, padx=10, pady=5)
from_email_entry = tk.Entry(root, width=50)
from_email_entry.grid(row=2, column=1, padx=10, pady=5)

tk.Label(root, text="Mot de Passe:").grid(row=3, column=0, padx=10, pady=5)
password_entry = tk.Entry(root, width=50, show="*")
password_entry.grid(row=3, column=1, padx=10, pady=5)

tk.Label(root, text="Objet:").grid(row=4, column=0, padx=10, pady=5)
subject_entry = tk.Entry(root, width=50)
subject_entry.grid(row=4, column=1, padx=10, pady=5)

tk.Label(root, text="Corps du message (HTML):").grid(row=5, column=0, padx=10, pady=5)
body_text = tk.Text(root, height=10, width=50)
body_text.grid(row=5, column=1, padx=10, pady=5)

# Bouton pour charger les emails depuis un fichier Excel
load_button = tk.Button(root, text="Charger Emails depuis Excel", command=load_emails_from_excel)
load_button.grid(row=6, column=0, columnspan=2, pady=10)

# Bouton pour ajouter un fichier à envoyer
upload_button = tk.Button(root, text="Ajouter une Pièce Jointe", command=upload_file)
upload_button.grid(row=7, column=0, columnspan=2, pady=10)

# Liste des fichiers attachés
tk.Label(root, text="Fichiers Attachés:").grid(row=8, column=0, padx=10, pady=5)
files_listbox = tk.Listbox(root, height=5, width=50)
files_listbox.grid(row=8, column=1, padx=10, pady=5)

# Bouton pour supprimer un fichier
delete_button = tk.Button(root, text="Supprimer Pièce Jointe", command=delete_file)
delete_button.grid(row=9, column=0, columnspan=2, pady=10)

# Barre de progression
progress_bar = ttk.Progressbar(root, length=200, mode="determinate")
progress_bar.grid(row=10, column=0, columnspan=2, pady=10)

# Label pour afficher le statut
status_label = tk.Label(root, text="")
status_label.grid(row=11, column=0, columnspan=2, pady=5)

# Bouton pour envoyer l'email
send_button = tk.Button(root, text="Envoyer", command=start_sending)
send_button.grid(row=11, column=0, columnspan=2, pady=10)

cancel_button = tk.Button(root, text="Annuler", command=cancel_sending)
cancel_button.grid(row=11, column=1)
cancel_button.grid_remove()  # le cache au départ

# Bouton pour prévisualiser l'email
preview_button = tk.Button(root, text="Aperçu de l'Email", command=preview_email)
preview_button.grid(row=12, column=0, columnspan=2, pady=10)


load_fields()
# Démarrage de l'interface graphique
root.mainloop()
