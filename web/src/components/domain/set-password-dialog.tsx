"use client";

import { useState, type FormEvent } from "react";
import { Dices } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal, ModalActions } from "@/components/ui/modal";
import { Field, TextInput } from "@/components/ui/form-field";
import { useSetAccountPassword, type Account } from "@/features/users";
import { generatePassword, STRONG_PASSWORD, STRONG_PASSWORD_HINT } from "@/lib/password";
import { toast } from "@/lib/toast-store";

/** Admin sets a new password for someone else. Mount with `key` = account id so the field starts empty. */
export function SetPasswordDialog({ account, onClose }: { account: Account; onClose: () => void }) {
  const setPassword = useSetAccountPassword();
  const [password, setValue] = useState("");
  const [error, setError] = useState<string>();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!STRONG_PASSWORD.test(password)) {
      setError(STRONG_PASSWORD_HINT);
      return;
    }
    setError(undefined);
    setPassword.mutate(
      { id: account.id, password },
      {
        onSuccess: () => {
          toast.success(`Password changed for ${account.name}. They've been signed out on all devices.`);
          onClose();
        },
      },
    );
  };

  return (
    <Modal open onClose={onClose} title="Set a new password" description={`${account.name} · ${account.email}`}>
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <Field label="New password" error={error} hint="Share it with them privately. They can change it later with “Forgot password”.">
              <TextInput
                required
                type="text"
                autoComplete="new-password"
                spellCheck={false}
                maxLength={72}
                className="font-mono"
                value={password}
                onChange={(e) => setValue(e.target.value)}
              />
            </Field>
          </div>
          <Button variant="secondary" className="mt-7" icon={<Dices className="w-4 h-4" />} onClick={() => setValue(generatePassword())}>
            Generate
          </Button>
        </div>
        <p className="text-sm text-slate-600">Their current password stops working immediately and they&rsquo;re signed out everywhere.</p>
        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={setPassword.isPending}>
            Change password
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
}
