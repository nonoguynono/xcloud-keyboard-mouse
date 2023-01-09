import { Label, Link, Shimmer, Text } from '@fluentui/react';
import React, { useState, useEffect } from 'react';

export default function ShortcutCommandsList() {
  const [commands, setCommands] = useState<chrome.commands.Command[] | null>(null);
  useEffect(() => {
    chrome.commands.getAll().then(setCommands);
  }, []);

  return (
    <section>
      <h3>Shortcuts</h3>
      {!commands ? (
        <Shimmer />
      ) : (
        <div>
          {commands.map((command) => {
            const htmlId = `command-${command.name}`;
            return (
              <div key={command.name} className="margin-bottom">
                <Label htmlFor={htmlId}>{command.description}</Label>
                <Text id={htmlId} className="command-keys">
                  {command.shortcut}
                </Text>
              </div>
            );
          })}
          <Link
            href="#"
            underline
            onClick={() =>
              chrome.tabs.create({
                url: 'chrome://extensions/shortcuts',
              })
            }
          >
            Change shortcut keys on the Extensions page...
          </Link>
        </div>
      )}
    </section>
  );
}
