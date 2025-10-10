import { Discordeno } from './deps.ts';

export type DesiredPropertiesMapped = Discordeno.RecursivePartial<Discordeno.TransformersDesiredProperties>;

export interface AssumedProperties extends DesiredPropertiesMapped {
  message: {
    id: true;
    reactions: true;
  };
}
export const assumedProperties: AssumedProperties = {
  message: {
    id: true,
    reactions: true,
  },
} as const;

export class DDFramework<DesiredProperties extends DesiredPropertiesMapped> {
  private desired: DesiredProperties;

  public constructor(options: unknown, properties: DesiredProperties) {
    this.desired = properties;
  }

  public getDesiredProperties(): DesiredProperties {
    return this.desired;
  }
}

const framework = new DDFramework(
  {},
  {
    message: {
      reactions: true,
    },
  } as const,
);
