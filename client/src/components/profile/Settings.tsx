import { Trash2 } from 'lucide-react';
import Button from '../ui/button';

const Settings = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground">
        Account Settings
      </h2>

      <div className="space-y-4">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <h3 className="text-md font-medium text-destructive mb-2">
            Danger Zone
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Once you delete your account, there is no going back. Please be
            certain.
          </p>
          <Button variant="destructive">
            <Trash2 className="w-4 h-4" />
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
