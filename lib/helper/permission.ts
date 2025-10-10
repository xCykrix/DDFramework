import { assumedProperties, DDFramework, DesiredPropertiesMapped } from '../../mod.ts';

export class Permission<T extends DesiredPropertiesMapped> {
  private framework: DDFramework<T>;
  private castFramework: DDFramework<typeof assumedProperties>;

  public constructor(framework: DDFramework<T>) {
    this.framework = framework;
    this.castFramework = framework as unknown as DDFramework<typeof assumedProperties>;
  }

  public getDesiredProperties(): T {
    this.castFramework.getDesiredProperties().message;
  }
}
